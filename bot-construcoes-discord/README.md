# Bot de construções do Discord

Bot para cadastrar construções dos inscritos usando:

- Nome do inscrito
- Nome da construção
- Plataforma: TikTok ou Twitch

## Comandos

- `/lancar inscrito construcao plataforma`
- `/construcoes [plataforma]`
- `/remover-construcao id`

O comando `/lancar` publica um cartão no canal e salva os dados em
`data/construcoes.json`.

## Requisitos

- Node.js 22.12.0 ou mais recente
- Uma aplicação criada no Discord Developer Portal

## Instalação

1. Extraia o projeto.
2. Abra o terminal dentro da pasta.
3. Execute:

```bash
npm install
```

4. Copie `.env.example` para um novo arquivo chamado `.env`.
5. Preencha `DISCORD_TOKEN`, `CLIENT_ID` e `GUILD_ID`.
6. Registre os comandos:

```bash
npm run deploy
```

7. Inicie o bot:

```bash
npm start
```

## Onde encontrar os IDs

Ative o Modo Desenvolvedor no Discord:

`Configurações > Avançado > Modo Desenvolvedor`

Depois:

- GUILD_ID: clique com o botão direito no servidor e copie o ID.
- CONSTRUCOES_CHANNEL_ID: clique com o botão direito no canal e copie o ID.
- CLIENT_ID: é o Application ID disponível na página General Information da aplicação.

## Permissões do bot

Ao gerar o convite no Developer Portal, selecione:

- Escopos: `bot` e `applications.commands`
- Permissões do bot: `View Channels`, `Send Messages` e `Embed Links`

Os comandos `/lancar` e `/remover-construcao` exigem que a pessoa tenha a
permissão `Manage Messages`.
