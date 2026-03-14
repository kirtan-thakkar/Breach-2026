import os
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.vectorstores import FAISS
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.embeddings import OllamaEmbeddings 
from langchain_community.chat_message_histories import ChatMessageHistory
from operator import itemgetter

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")
if groq_api_key:
    os.environ["GROQ_API_KEY"] = groq_api_key

# Use path relative to app root or env var
file_path = os.getenv("RAG_PDF_PATH", "backend/app/langchain/lang.pdf")

if os.path.exists(file_path):
    loader = PyPDFLoader(file_path)
    doc = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=20)
    chunk_data = text_splitter.split_documents(doc)
    embeddings = OllamaEmbeddings(model="nomic-embed-text")
    vectoreStore = FAISS.from_documents(chunk_data, embeddings)
    retriever = vectoreStore.as_retriever()

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Answer using only this PDF context. Say 'I don't know' if unsure:\n{context}"),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human","{question}")
    ])

    def format_docs(docs):
        return "\n\n".join([doc.page_content for doc in docs])

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

    store = {}
    def get_session_history(session_id):
        if session_id not in store:
            store[session_id] = ChatMessageHistory()
        return store[session_id]

    chat_chain = RunnableWithMessageHistory(
        raq_chain,
        get_session_history,
        input_messages_key="question",
        history_messages_key="chat_history",
    )
else:
    print(f"Warning: RAG PDF not found at {file_path}")
    chat_chain = None

if __name__ == "__main__" and chat_chain:
    # test session-1
    session_id = "session-1"
    print("Chat with PDF (type 'quit' to exit):")

    while True:
        question = input("\nYou: ")
        if question.lower() in ['quit', 'exit']: break
        
        result = chat_chain.invoke(
            {"question": question},
            config={"configurable": {"session_id": session_id}}
        )
        print(f"Bot: {result.content}")