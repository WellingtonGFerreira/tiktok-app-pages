export default async function handler(req, res) {
    try {
        const { method, query } = req;

        if (method !== "GET") {
            return res.status(405).json({ ok: false, error: "Method not allowed" });
        }

        const code = query.code || "";
        const state = query.state || "";

        if (!code) {
            return res.status(400).json({ ok: false, error: "Missing code" });
        }

        // 1) Validação simples de state (opcional, mas recomendado)
        //    Se quiser, gere um state ao iniciar o fluxo e valide aqui.
        //    Por enquanto, deixamos passar mesmo vazio.

        // 2) Enviar o code ao n8n (Webhook) para trocar por tokens
        //    Configure a variável N8N_WEBHOOK_URL no painel da Vercel (Environment Variables)
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        const webhookSecret = process.env.N8N_SHARED_SECRET || "";

        if (!webhookUrl) {
            return res.status(500).json({ ok: false, error: "Webhook not configured" });
        }

        const payload = {
            provider: "tiktok",
            code,
            state,
            receivedAt: new Date().toISOString(),
            secret: webhookSecret
        };

        const resp = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const text = await resp.text();

        // 3) Redirecionar o usuário para uma página de sucesso simples
        //    Você pode trocar por uma página sua (ex.: /oauth-ok.html)
        if (resp.ok) {
            return res.status(302).setHeader("Location", "/").end();
        } else {
            return res.status(500).json({ ok: false, error: "Webhook failed", detail: text });
        }
    } catch (err) {
        return res.status(500).json({ ok: false, error: "Unexpected error", detail: String(err) });
    }
}
