---
title: "Homelab - Using Proxmox and configuring Kubernetes with Microk8s"
date: 2023-06-24
draft: false
author: Luiz Borges
tags: [Microk8s, Proxmox, UbuntuServer, Gitlab, Kubernetes, Homelab, GitOps, ArgoCD, AzureDevOps]
---





![Bryce Canyon National Park](1687609314721.jpg)


### Introdução

No início do ano queria iniciar os estudos em Kubernetes e para isso precisaria subir um cluster local ou na cloud, e com isso encontrei dois problemas, subir o cluster na cloud teria um custo mesmo que seja mínimo na Google cloud conforme esse [tópico](https://github.com/cloudcommunity/Cloud-Free-Tier-Comparison) do GitHub.

Então a solução é subir um cluster localmente, e pensei em duas opções, subir o cluster no meu computador principal desktop, ou no meu notebook, bom já não queria colocar nenhuma carga de trabalho no meu desktop agora com Windows, e não mais Linux, o que não ficaria muito legal, a segunda opção foi subir o cluster em um Proxmox dentro do notebook Thinkpad T470, visto que queria realizar testes e aprendizado em cima do Proxmox, vi que não precisaria de um Xeon, para construir um homelab mesmo que pequeno, que será valioso para aprendizado.

### Thinkpad T470

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQFKGn-oMIl87w/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1687611564583?e=1778112000&v=beta&t=SKp6sujpWI78Dj00ZqqHpFsY8GqW7TofQxjqDJo5PgA)

Não foi fornecido texto alternativo para esta imagem

Bom, comprei um T470 usado e fiz um upgrade de memória, agora totalizando 16GB, comprei para estudo, e agora vai me servir para estudar um servidor em pequena escala, vamos ver o que conseguimos fazer com o que temos de hardware.

### Proxmox e Pihole

Então instalei o proxmox no T470, em sua versão 7.4, durante a instalação temos que escolher um nome de domínio para esse nosso novo servidor, e assim escolhi algo bem padrão como homelab.com.

Bom com o Proxmox instalado podemos configurar ele em https, e para conseguir isso temos dois obstáculos, precisamos de um dns server, ou iremos ter que ficar editando arquivos hosts sempre, e precisamos também de um certificado.

Como estamos trabalhando localmente, podemos emitir um self signed certificate, e criar a nossa própria CA (Certificate Authority), bom para isso utilizei o openssl e segui um [guia](https://github.com/ChristianLempa/cheat-sheets/blob/main/misc/ssl-certs.md) do [Christian Lempa](https://www.linkedin.com/in/christianlempa/). O certificado foi criado como wildcard para utilizarmos em diversos serviços.

\*.homelab.com

homelab.com

Bom com o certificado, precisei subir um dns server, testei 3: Windows Server DNS, Ad Guard e Pihole. Por fim optei por utilizar o Pihole, até agora sem bugs e muito leve se comparado a rodar um Microsoft Windows server só para isso.

Agora na aba de local dns configuramos o dns do proxmox e de nossos outros servers, e vamos utilizar ele a frente para configurar os que saem do cluster microk8s.

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQGCmpMCF9QSMw/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1687609497261?e=1778112000&v=beta&t=f4XXHiFaE2S4c5YktN4Z30i60mlfQhZ8zlCcVrf0JhQ)

Não foi fornecido texto alternativo para esta imagem

Assim ficou o Proxmox já configurado com https:

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQH3LQAVf3VQpw/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687613980175?e=1778112000&v=beta&t=Pqrzou9sP9q4ULpi6DEt9AbcBu6wO3y_79NunXS39_0)

Não foi fornecido texto alternativo para esta imagem

### Kubernetes Cluster

Porque escolher microk8s?

Inicialmente a intenção era subir um k3s junto com o Rancher da Suse mas não deu muito certo, infelizmente tive muitos bugs e além disso somente o Rancher consumiu toda a memória do t470, então logo já vi que precisaria de uma alternativa ao Rancher para gerenciar o cluster.

Outra opção que é muito mais simples de instalar, configurar, tem addons, foi o microk8s da [Canonical](https://www.linkedin.com/company/canonical/), e como eu já tinha a imagem do Ubuntu Server 22.04 dentro do Proxmox, por que não?

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQHZNKMwy6a7UQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687611504315?e=1778112000&v=beta&t=9F9HhkeH8Hfffs0u2j_BX1w3AK3TW0LPKdMfTS_cj44)

Não foi fornecido texto alternativo para esta imagem

Instalar o microk8s foi muito simples, a única configuração que tive que fazer a parte era direcionar o cluster a versão 1.26 do Kubernetes para funcionar com alguns charts helm.

### Microk8s addons e HA

Os addons do microk8s facilitam muito a vida, podemos instalar recursos que são utilizados em diversos deployments, como cert-manager, observability (prometheus e grafana), ingress, hostpath-storage e por aí vai.

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQGnOgUiZiX6CA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687609814232?e=1778112000&v=beta&t=Ltb2Tnk06LbvFWB1rWNR6NdybAOeTs97AgPzNXDrg0A)

Não foi fornecido texto alternativo para esta imagem

Agora para instalar o HA (High Availability) foi muito mais custoso, porque ao todo temos 16gb de ram, então instalei o HA do microk8s assim como diz a documentação utilizando de 3 nodes. Mas uma hora ou outra terei de desligar 2 deles e desabilitar o HA, para fazer algum deployment que demande muitos recursos, atualmente fiz o teste somente do postgree-ha nos 3 nodes, e esta tudo ok com os 16gb ram.

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQFAVuoQDyIlwQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687609923226?e=1778112000&v=beta&t=3lQVJg2atT2J-2IJMvgZj8sLXdZbcwOD4nduzfPIjkY)

Não foi fornecido texto alternativo para esta imagem

Uma observação, o ubuntuk8s é o cluster 0, o nome está dessa forma porque inicialmente a intenção não era ter um HA.

### Lens

Como havia falado o Rancher consumiu todo o recurso da máquina, e deixarei para usa-lo na próxima vez quando tiver 32gb ram. A alternativa que encontrei foi o Lens, software totalmente free para uso pessoal, posso instalar no Windows, no Mac e no Linux, basicamente um IDE para o nosso microk8s e graças ao addon de observability, consigo monitorar o uso de recursos dos clusters no Lens.

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQFv-G0JyGrEOA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687610161285?e=1778112000&v=beta&t=WLv8f4k7_oqpPhT7dzO_hqLTHIYXOaKn5pkDTjpr6lY)

Não foi fornecido texto alternativo para esta imagem

E claro a visão dos nodes e pods:

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQH6zujA8uaRhg/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687610273736?e=1778112000&v=beta&t=05hUQlmh6ik5X_AiVtxP2n9xHRwwfVk58YSY8C8B4-Y)

Não foi fornecido texto alternativo para esta imagem

### ArgoCD

Bom já que agora tenho um cluster porque não implementar GitOps com o ArgoCD? Configurei o ArgoCD dentro do cluster e apontei para o Gitlab, e para um teste inicio fiz a implementação de um yaml para deployment de Agents do VSTS ou melhor Azure DevOps.

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQHwHmB7xmzsqg/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1687610385524?e=1778112000&v=beta&t=OCuLtsDccTHmF2vkrHlYdf-nU7kim8Jf8GOzdRA-ukQ)

Não foi fornecido texto alternativo para esta imagem

Bom, resumindo o fluxo do GitOps, localmente faço a edição de um yaml contendo um StateFullSet, realizo o commit e push para o repo no Gitlab, e diretamente o ArgoCD realiza o sync com o repo, e na sequência faz o deploy do yaml no cluster automaticamente.

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQGdCdCN8-B21g/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687610446691?e=1778112000&v=beta&t=WHnv7lasSrRK5A9FWcwSQGjVNz6oRdQOITWTuB7iHHQ)

Não foi fornecido texto alternativo para esta imagem

E como consequência já temos os Agents online no VSTS, podemos alterar o número de réplicas para quantos precisarmos:

![Não foi fornecido texto alternativo para esta imagem](https://media.licdn.com/dms/image/v2/D4D12AQF_QHFcE4lPpA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1687610549266?e=1778112000&v=beta&t=-JGdL8GAvx-LVoh4q_T-l_eeaYD2zXuDuDYo5Z4gKQk)

Não foi fornecido texto alternativo para esta imagem

### Conclusão

Temos agora um cluster Kubernetes para estudo, junto com ele temos o Proxmox para estudo da infra, e o ArgoCD para estudo do GitOps. Nessa presente data já fiz mais testes e tem mais softwares configurados dentro do Proxmox como Firewall Fortigate VM em sua licença always free, Jellyfin estação multimídia e Navidrome reprodutor de música.

Para mais artigos como esse comentem abaixo, artigos com detalhes sobre como instalar Proxmox, configurar o microk8s, ArgoCD, Lens, VSTS Agent, Vaultwarden e etc.

Referencias e Links uteis:

[https://github.com/ChristianLempa/cheat-sheets](https://github.com/ChristianLempa/cheat-sheets)

