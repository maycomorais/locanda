// supabaseClient.js — Locanda Pizzeria

const _SUPABASE_URL = 'https://ovhlxaouwclmryeidbyl.supabase.co';
const _SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92aGx4YW91d2NsbXJ5ZWlkYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTcyMjksImV4cCI6MjA4ODE5MzIyOX0.HWVjiHCGfPWzv-UoD44epJMFcYkUnEFbMfl6lXxEMfo';

if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.error("ERRO CRÍTICO: A biblioteca do Supabase não carregou. Verifique o HTML.");
    alert("Erro de conexão. Por favor, recarregue a página.");
} else {
    window.supa = window.supabase.createClient(_SUPABASE_URL, _SUPABASE_KEY);
    console.log("Locanda Pizzeria — Banco iniciado com sucesso");
}

async function checkUser() {
    const { data: { session } } = await window.supa.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
    }
    return session;
}
