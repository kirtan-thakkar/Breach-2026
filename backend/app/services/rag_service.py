import os
from typing import Optional
from operator import itemgetter
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.vectorstores import FAISS
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.embeddings import OllamaEmbeddings 
from langchain_community.chat_message_histories import ChatMessageHistory
from dotenv import load_dotenv
from datetime import datetime
from app.core.supabase import get_supabase
from typing import Optional, Any

load_dotenv()

class RAGService:
    def __init__(self, pdf_path: Optional[str] = None):
        self.pdf_path = pdf_path or os.getenv("RAG_PDF_PATH", "backend/app/langchain/lang.pdf")
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.store = {}
        self.chat_chain = None
        self._initialize_chain()

    def _initialize_chain(self):
        if not os.path.exists(self.pdf_path):
            print(f"Warning: RAG PDF not found at {self.pdf_path}. Chatbot will be limited.")
            return

        try:
            loader = PyPDFLoader(self.pdf_path)
            doc = loader.load()

            text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=20)
            chunk_data = text_splitter.split_documents(doc)

            embeddings = OllamaEmbeddings(model="nomic-embed-text")
            vector_store = FAISS.from_documents(chunk_data, embeddings)
            retriever = vector_store.as_retriever()

            prompt = ChatPromptTemplate.from_messages([
                ("system", "Answer using only this PDF context. Say 'I don't know' if unsure:\n{context}"),
                MessagesPlaceholder(variable_name="chat_history"),
                ("human", "{question}")
            ])

            def format_docs(docs):
                return "\n\n".join([d.page_content for d in docs])

            llm = ChatGroq(model="openai/gpt-oss-120b")

            raq_chain = (
                {
                    "context": itemgetter("question") | retriever | format_docs,
                    "question": itemgetter("question"),
                    "chat_history": itemgetter("chat_history"),
                }
                | prompt 
                | llm
            )

            self.chat_chain = RunnableWithMessageHistory(
                raq_chain,
                self._get_session_history,
                input_messages_key="question",
                history_messages_key="chat_history",
            )
        except Exception as e:
            print(f"Error initializing RAG chain: {e}")

    def _get_session_history(self, session_id):
        if session_id not in self.store:
            self.store[session_id] = ChatMessageHistory()
        return self.store[session_id]

    async def ask(self, session_id: str, question: str, user_email: Optional[str] = None):
        """
        Ask a question, optionally including the user's specific simulation history.
        """
        if not self.chat_chain:
            return "I'm sorry, my knowledge base is currently offline. Please try again later."
        
        history_context = ""
        if user_email:
            try:
                supabase = get_supabase()
                # Find target by email
                target = supabase.table("targets").select("id").eq("email", user_email).execute()
                if target.data:
                    tid = target.data[0]["id"]
                    # Get simulations and events
                    sims = supabase.table("simulations").select("id, campaign_id").eq("target_id", tid).execute()
                    s_ids = [s["id"] for s in sims.data]
                    events = supabase.table("simulation_events").select("*").in_("simulation_id", s_ids).execute()
                    
                    if events.data:
                        history_context = "\nUSER SIMULATION HISTORY:\n"
                        for ev in events.data:
                            history_context += f"- Event: {ev['event_type']} at {ev['created_at']}\n"
                        history_context += "\nPlease help the user understand why these specific actions were risky.\n"
            except Exception as e:
                print(f"Error fetching user history for AI: {e}")

        try:
            full_question = f"{history_context}\nUSER QUESTION: {question}"
            result = self.chat_chain.invoke(
                {"question": full_question},
                config={"configurable": {"session_id": session_id}}
            )
            return str(result.content)
        except Exception as e:
            print(f"Error in RAG ask: {e}")
            return "I encountered an error while processing your request."

rag_service = RAGService()
