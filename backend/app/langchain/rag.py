import os
from dataclasses import dataclass
from operator import itemgetter
from typing import Dict, List, Optional

from dotenv import load_dotenv
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_groq import ChatGroq
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv()


@dataclass
class RAGConfig:
    pdf_path: str = os.getenv("RAG_PDF_PATH", "backend/app/langchain/lang.pdf")
    llm_model: str = os.getenv("RAG_LLM_MODEL", "openai/gpt-oss-120b")
    embedding_model: str = os.getenv("RAG_EMBEDDING_MODEL", "nomic-embed-text")
    chunk_size: int = int(os.getenv("RAG_CHUNK_SIZE", "300"))
    chunk_overlap: int = int(os.getenv("RAG_CHUNK_OVERLAP", "20"))
    top_k: int = int(os.getenv("RAG_TOP_K", "4"))


class PhishingRAGArchitecture:
    """Reusable LangChain architecture for phishing coaching and Q&A."""

    def __init__(self, config: Optional[RAGConfig] = None):
        self.config = config or RAGConfig()
        self._store: Dict[str, ChatMessageHistory] = {}
        self.chat_chain: Optional[RunnableWithMessageHistory] = None
        self._ready = False

        groq_api_key = os.getenv("GROQ_API_KEY")
        if groq_api_key:
            os.environ["GROQ_API_KEY"] = groq_api_key

        self._build()

    @property
    def is_ready(self) -> bool:
        return self._ready and self.chat_chain is not None

    def _build(self) -> None:
        if not os.path.exists(self.config.pdf_path):
            print(f"Warning: RAG PDF not found at {self.config.pdf_path}")
            return

        try:
            loader = PyPDFLoader(self.config.pdf_path)
            docs = loader.load()
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.config.chunk_size,
                chunk_overlap=self.config.chunk_overlap,
            )
            chunk_data = text_splitter.split_documents(docs)

            if not chunk_data:
                print("Warning: No document chunks were generated for RAG.")
                return

            embeddings = OllamaEmbeddings(model=self.config.embedding_model)
            vector_store = FAISS.from_documents(chunk_data, embeddings)
            retriever = vector_store.as_retriever(search_kwargs={"k": self.config.top_k})

            prompt = ChatPromptTemplate.from_messages(
                [
                    (
                        "system",
                        """
You are a phishing-awareness assistant.
Use the provided document context and optional user-behavior context.
If context is insufficient, reply with: I don't know.
Keep suggestions practical, short, and directly actionable.

Reference context:
{context}
""".strip(),
                    ),
                    MessagesPlaceholder(variable_name="chat_history"),
                    ("human", "{question}"),
                ]
            )

            rag_chain = (
                {
                    "context": itemgetter("question") | retriever | self._format_docs,
                    "question": itemgetter("question"),
                    "chat_history": itemgetter("chat_history"),
                }
                | prompt
                | ChatGroq(model=self.config.llm_model)
            )

            self.chat_chain = RunnableWithMessageHistory(
                rag_chain,
                self._get_session_history,
                input_messages_key="question",
                history_messages_key="chat_history",
            )
            self._ready = True
        except Exception as error:
            print(f"Error initializing LangChain architecture: {error}")

    @staticmethod
    def _format_docs(docs) -> str:
        return "\n\n".join(doc.page_content for doc in docs)

    def _get_session_history(self, session_id: str) -> ChatMessageHistory:
        if session_id not in self._store:
            self._store[session_id] = ChatMessageHistory()
        return self._store[session_id]

    @staticmethod
    def build_user_history_context(events: Optional[List[dict]]) -> str:
        if not events:
            return ""

        counts: Dict[str, int] = {}
        timeline: List[str] = []

        for event in events:
            event_type = str(event.get("event_type", "unknown"))
            counts[event_type] = counts.get(event_type, 0) + 1
            created_at = str(event.get("created_at", "unknown-time"))
            timeline.append(f"- {event_type} at {created_at}")

        summary_lines = ["USER SECURITY HISTORY:"]
        summary_lines.extend([f"- {key}: {value}" for key, value in sorted(counts.items())])

        summary_lines.append("Recent timeline:")
        summary_lines.extend(timeline[:10])
        summary_lines.append("Use this history to explain repeated mistakes and prevention steps.")

        return "\n".join(summary_lines)

    @staticmethod
    def _compose_question(question: str, user_context: Optional[str] = None) -> str:
        cleaned_question = question.strip()
        if not user_context:
            return cleaned_question

        return f"{user_context}\n\nUSER QUESTION: {cleaned_question}"

    def ask(self, question: str, session_id: str = "default", user_context: Optional[str] = None) -> str:
        if not self.chat_chain:
            return "I'm sorry, my knowledge base is currently offline. Please try again later."

        try:
            full_question = self._compose_question(question=question, user_context=user_context)
            result = self.chat_chain.invoke(
                {"question": full_question},
                config={"configurable": {"session_id": session_id}},
            )
            return str(result.content)
        except Exception as error:
            print(f"Error in LangChain ask: {error}")
            return "I encountered an error while processing your request."


rag_engine = PhishingRAGArchitecture()
chat_chain = rag_engine.chat_chain


if __name__ == "__main__" and rag_engine.is_ready:
    session = "session-1"
    print("Chat with phishing knowledge base (type 'quit' to exit):")

    while True:
        user_question = input("\nYou: ")
        if user_question.lower() in ["quit", "exit"]:
            break

        answer = rag_engine.ask(question=user_question, session_id=session)
        print(f"Bot: {answer}")