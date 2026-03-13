---
title: "Homelab - Installing your own AI locally"
date: 2024-01-02
draft: false
author: Luiz Borges
tags: [AI, ChatGTP, Homelab, Vicuna, LMSYS, TextGeneration]
---

![Bryce Canyon National Park](1703943543766.jpg)

Indo direto ao ponto, o motivo de escrita desse artigo, convém a curiosidade de como possuir uma IA assim como o ChatGPT instalado localmente, sem a necessidade de pagar pelo serviço. Isso será possibilitado por modelos de IA, opensource, como o Vicuna, do qual iremos utilizar no lab desse artigo. Localmente, seja na workstation ou servidor, poderá testar diversos desses modelos open source, utilizando a web-ui da qual iremos instalar, porém de certa forma estando limitado a quantidade memoria RAM e a GPU/VRAM disponível.

Poderíamos colocar a nossa IA no servidor Proxmox, porém como o nosso servidor Proxmox, como pode ser lido no [artigo](/posts/homelab-using-proxmox-and-configuring-kubernetes-with-microk8s/) passado, está em um T470, esse Lenovo Thinkpad não possui uma RTX da Nvidia, ou mesmo outra GPU dedicada, então para esse lab teremos de utilizar o próprio desktop.

> PS: Caso tenha uma placa NVIDIA e AMD no servidor Proxmox faça um passthrough da placa de vídeo para dentro da vm. Segue [documentação](https://pve.proxmox.com/wiki/PCI_Passthrough) de Passthrough.

### Pré-requisitos do lab

Considerando rodar o modelo do Vicuna-7B:

1. Memory: 24GB RAM
2. GPU: Igual ou superior a 8GB VRAM
3. Disk space: 50GB

Tenha em mente em quanto maior o modelo 7B, 13B, 32B, maior a quantidade RAM, que irá consumir, além disso o poder computacional da placa de vídeo é muito importante, por exemplo, o modelo 13B foi carregado com sucesso, porém ficou demasiadamente lento mesmo com uma NVIDIA RTX 2060 Super.

---

### Realizando download da web-ui

Nesse artigo vamos utilizar a web-ui do oobabooga:

[https://github.com/oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui)

Então clonamos esse repo:

```bash
git clone https://github.com/oobabooga/text-generation-webui
cd text-generation-webui
```

Na sequencia dependendo de seu SO, execute um dos scripts para instalar a ferramenta:

```bash
start_linux.sh
start_windows.bat
start_macos.sh
start_wsl.bat
```

Como estamos em uma maquina Windows, executar o seguinte comando para instalar:

```powershell
.\start_windows.bat
```

Após instalar alguns pacotes, você deve escolher a opção de GPU, que você possui no hardware, no nosso caso, uma NVIDIA RTX, então selecionar opção correspondente:

A instalação continua instalando pytorch e outros packages de python necessários para a execução do Modelo. Após aproximadamente 10min , temos a web ui rodando.

### Realizando download do modelo

Agora com a web-ui funcionando, basta realizarmos o download do modelo, para isso basta acessar [HuggingFace](https://huggingface.co/) e escolher o modelo para utilizar, tenha atenção ao tipo do modelo:

Como vamos configurar um chatbot, escolhemos Vicuna do tipo Text Generation. Lembrando, tenha em mente a quantidade de parâmetros do modelo, tente rodar o menor primeiro em seguida o maior, por exemplo 7B, e na sequencia o 13B, caso o 13B fique muito lento, no que foi o nosso caso, temos que se contentar com o 7B, isso levando em consideração o Vicuna.

Seguindo para o download, copie o nome do modelo e vá na web ui em

**models > Download model or LoRA**

Com o download finalizado, por fim devemos carregar o modelo.

### Validação do chat e modelo Vicuna-7b

Vá na aba chat. Para validar o Vicuna, vamos gerar um código de terraform para provisionar na AWS, uma simples lambda function com o nome t-800:

O Vicuna, quer dizer T800, assumiu por conta própria que o runtime dessa lambda será em node.js, e que o tipo da lambda é um upload de arquivo .zip e não do tipo container image. Dessa maneira, o modelo apesar de não ser tão preciso quando o 13B e o 32B, se prova uma opção viável para estudar, criar códigos, traduzir idiomas, tudo mais que uma IA pode fazer.

---

### Bônus: Customize o chat

A web ui proporciona um campo para customizarmos o chat, assim podemos criar qualquer character no chat, vá na aba parameters > character e preencha nome e picture conforme o desejado.

Como podem ver, criei o T800 de Terminator 1984, somente para levantar a brincadeira do medo que a IA traz.

Acompanhe os outros artigos, incluindo a introdução a serie homelab:

1. [Homelab – Utilizando Proxmox e configurando Kubernetes com Microk8s](/posts/homelab-using-proxmox-and-configuring-kubernetes-with-microk8s/)
