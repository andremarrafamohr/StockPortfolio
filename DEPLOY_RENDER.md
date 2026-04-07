# Deploy no Render (Backend + Frontend)

Este projeto ja esta preparado para deploy no Render. Segue esta ordem para evitar erros de CORS e de ligacao API.

## 1) Publicar o backend (Web Service)

1. No Render, cria um novo Web Service para a pasta `server`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Define estas variaveis de ambiente no backend:
   - `MONGO_URI` = tua connection string do MongoDB Atlas
   - `JWT_SECRET` = string longa e aleatoria
   - `ALPHA_VANTAGE_KEY` = chave da API (opcional se nao estiveres a usar)
   - `CLIENT_ORIGINS` = URL do frontend no Render (exemplo: `https://stockportfolio-web.onrender.com`)
5. Guarda a URL gerada do backend (exemplo: `https://stockportfolio-api.onrender.com`).

## 2) Publicar o frontend (Static Site)

1. No Render, cria um novo Static Site para a pasta `client`.
2. Build Command: `npm install && npm run build`
3. Publish Directory: `dist`
4. Define a variavel no frontend:
   - `VITE_API_URL` = URL do backend (exemplo: `https://stockportfolio-api.onrender.com`)

## 3) Validar CORS

Depois do frontend estar criado, confirma no backend que `CLIENT_ORIGINS` tem exatamente a URL final do frontend. Se mudares dominio/subdominio, atualiza esta variavel.

## 4) Blueprint opcional

Se quiseres criar os dois servicos de uma vez, usa o ficheiro `render.yaml` na raiz do repo com Blueprint no Render.

## Notas importantes

- O plano free do Render pode hibernar servicos; o primeiro pedido pode demorar alguns segundos.
- O filesystem do Render nao e persistente. Screenshots em `uploads` podem desaparecer em novo deploy/restart. Para manter imagens, usa storage externo (Cloudinary, S3, etc.).
- Nunca comitar ficheiros `.env` com segredos.