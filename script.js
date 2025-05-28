// IMPORTAÇÕES DO FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyC825l8n3VHhiKnw6RTnChWENAA7sCoOkM",
  authDomain: "controle-financeiro---urbanizy.firebaseapp.com",
  projectId: "controle-financeiro---urbanizy",
  storageBucket: "controle-financeiro---urbanizy.firebasestorage.app",
  messagingSenderId: "751274678648",
  appId: "1:751274678648:web:954fc0269f4608eb0e908d",
  measurementId: "G-HZN5LZHTR7"
};

// INICIALIZAÇÃO
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// ELEMENTOS DA INTERFACE
const emailForm = document.getElementById("email-login-form");
const logoutBtn = document.getElementById("logout");

const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const typeInput = document.getElementById("type");

const incomeDisplay = document.getElementById("income");
const expenseDisplay = document.getElementById("expense");
const balanceDisplay = document.getElementById("balance");

// TELA LOGIN E SISTEMA
const loginSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");

// FORMATAÇÃO
function formatCurrency(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// AUTENTICAÇÃO POR E-MAIL
emailForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const senha = document.getElementById("password").value;

  try {
    const result = await signInWithEmailAndPassword(auth, email, senha);
    currentUser = result.user;
    carregarTransacoes();
    toggleUI(true);
  } catch (error) {
    alert("Erro ao fazer login. Verifique seu e-mail e senha.");
    console.error(error);
  }
});

// LOGOUT
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  currentUser = null;
  toggleUI(false);
  transactionList.innerHTML = "";
});

// MONITORA USUÁRIO LOGADO
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    carregarTransacoes();
    toggleUI(true);
  } else {
    toggleUI(false);
  }
});

// ALTERA TELA
function toggleUI(logado) {
  if (logado) {
    loginSection.style.display = "none";
    appSection.style.display = "block";
  } else {
    loginSection.style.display = "block";
    appSection.style.display = "none";
  }
}

// ADICIONAR TRANSAÇÃO
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const transaction = {
    description: descriptionInput.value,
    amount: parseFloat(amountInput.value),
    type: typeInput.value,
    date: dateInput.value,
    uid: currentUser.uid
  };

  await addDoc(collection(db, "transacoes"), transaction);
  form.reset();
  carregarTransacoes();
});

// CARREGAR TRANSAÇÕES DO USUÁRIO
async function carregarTransacoes() {
  if (!currentUser) return;

  const q = query(collection(db, "transacoes"), where("uid", "==", currentUser.uid));
  const querySnapshot = await getDocs(q);
  const transacoes = [];

  transactionList.innerHTML = "";

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    transacoes.push({ ...data, id: docItem.id });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.description}</td>
      <td>${data.type}</td>
      <td>${formatCurrency(data.amount)}</td>
      <td>${data.date}</td>
      <td><button onclick="deletarTransacao('${docItem.id}')">Excluir</button></td>
    `;
    transactionList.appendChild(row);
  });

  atualizarResumo(transacoes);
}

// EXCLUIR TRANSAÇÃO
window.deletarTransacao = async function (id) {
  await deleteDoc(doc(db, "transacoes", id));
  carregarTransacoes();
};

// ATUALIZAR RESUMO
function atualizarResumo(transacoes) {
  const entradas = transacoes.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0);
  const saidas = transacoes.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0);
  const saldo = entradas - saidas;

  incomeDisplay.textContent = formatCurrency(entradas);
  expenseDisplay.textContent = formatCurrency(saidas);
  balanceDisplay.textContent = formatCurrency(saldo);
}
