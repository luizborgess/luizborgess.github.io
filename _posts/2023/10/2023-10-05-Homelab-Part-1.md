---
layout: post
title: Homelab – Utilizando Proxmox e configurando Kubernetes com Microk8s
image: ..\assets\images\homelab-Part-1\Thumbnail.png
---
![Logo Jekyll]({{site.url}}\assets\images\homelab-Part-1\Thumbnail.png )

## Introdução

No início do ano queria iniciar os estudos em Kubernetes e para isso precisaria subir um cluster local ou na cloud, e com isso encontrei dois problemas, subir o cluster na cloud teria um custo mesmo que seja mínimo na Google cloud conforme esse tópico do GitHub.
Então a solução é subir um cluster localmente, e pensei em duas opções, subir o cluster no meu computador principal desktop, ou no meu notebook, bom já não queria colocar nenhuma carga de trabalho no meu desktop agora com Windows, e não mais Linux, o que não ficaria muito legal, a segunda opção foi subir o cluster em um Proxmox dentro do notebook Thinkpad T470, visto que queria realizar testes e aprendizado em cima do Proxmox, vi que não precisaria de um Xeon, para construir um homelab mesmo que pequeno, que será valioso para aprendizado.
{: .text-justify}


## Thinkpad T470
<p align="center">
  <img src="{{site.url}}\assets\images\homelab-Part-1\1687611564583.png" alt="Thinkpad" width="400" height="300"/>
</p>

Bom, comprei um T470 usado e fiz um upgrade de memória, agora totalizando 16GB, comprei para estudo, e agora vai  me servir para estudar um servidor em pequena escala, vamos ver o que conseguimos fazer com o que temos de hardware. 
{: .text-justify}
## Proxmox e Pihole

Então instalei o proxmox no T470, em sua versão 7.4, durante a instalação temos que escolher um nome de domínio para esse nosso novo servidor, e assim escolhi algo bem padrão como homelab.com.  
Bom com o Proxmox instalado podemos configurar ele em https, e para conseguir isso temos dois obstáculos, precisamos de um dns server, ou iremos ter que ficar editando arquivos hosts sempre, e precisamos também  de um certificado.  
Como estamos trabalhando localmente, podemos emitir um self signed certificate, e criar a nossa própria CA (Certificate Authority), bom para isso utilizei o openssl e segui um guia do Christian Lempa. O certificado foi criado como wildcard para utilizarmos em diversos serviços.
{: .text-justify}

> *.homelab.com

> homelab.com

Bom com o certificado, precisei subir um dns server, testei 3: Windows Server DNS, Ad Guard e Pihole. Por fim optei por utilizar o Pihole, até agora sem bugs e muito leve se comparado a rodar um Microsoft Windows server só para isso. 
Agora na aba de local dns configuramos o dns do proxmox e de nossos outros servers, e vamos utilizar ele a frente para configurar os que saem do cluster microk8s.
{: .text-justify}
![Pihole]({{site.url}}\assets\images\homelab-Part-1\1687609497261.png)
Assim ficou o Proxmox já configurado com https:
{: .text-justify}
![Proxmox]({{site.url}}\assets\images\homelab-Part-1\1687613980175.png)

## Kubernetes Cluster 

Porque escolher microk8s?  
Inicialmente a intenção era subir um k3s junto com o Rancher da Suse mas não deu muito certo, infelizmente tive muitos bugs e além disso somente o Rancher consumiu toda a memória do t470, então logo já vi que precisaria de uma alternativa ao Rancher para gerenciar o cluster.
Outra opção que é muito mais simples de instalar, configurar, tem addons, foi o microk8s da Canonical, e como eu já tinha a imagem do Ubuntu Server 22.04 dentro do Proxmox, por que não?
{: .text-justify}
![Microk8s]({{site.url}}\assets\images\homelab-Part-1\1687611504315.png)

Instalar o microk8s foi muito simples, a única configuração que tive que fazer a parte era direcionar o cluster a versão 1.26 do Kubernetes para funcionar com alguns charts helm.
{: .text-justify}

## Microk8s addons e HA 
Os addons do microk8s facilitam muito a vida, podemos instalar recursos que são utilizados em diversos deployments, como cert-manager, observability (prometheus e grafana), ingress, hostpath-storage e por aí vai.
{: .text-justify}
![Addons]({{site.url}}\assets\images\homelab-Part-1\1687609814232.png)

Agora para instalar o HA (High Availability) foi muito mais custoso, porque ao todo temos 16gb de ram, então instalei o HA do microk8s assim como diz a documentação utilizando de 3 nodes. Mas uma hora ou outra terei de desligar 2 deles e desabilitar o HA, para fazer algum deployment que demande muitos recursos, atualmente fiz o teste somente do postgree-ha nos 3 nodes, e esta tudo ok com os 16gb ram.
{: .text-justify}
![Nodes]({{site.url}}\assets\images\homelab-Part-1\1687609923226.png)

Uma observação, o ubuntuk8s é o cluster 0, o nome está dessa 
forma porque inicialmente a intenção não era ter um HA.
{: .text-justify}
## Lens

Como havia falado o Rancher consumiu todo o recurso da máquina, e deixarei para usa-lo na próxima vez quando tiver 32gb ram. A alternativa que encontrei foi o Lens, software totalmente free para uso pessoal, posso instalar no Windows, no Mac e no Linux, basicamente um IDE para o nosso microk8s e graças ao addon de observability, consigo monitorar o uso de recursos dos clusters no Lens.
{: .text-justify}
![Lens]({{site.url}}\assets\images\homelab-Part-1\1687610161285.png)

E claro a visão dos nodes e pods: 
![Lens]({{site.url}}\assets\images\homelab-Part-1\1687610273736.png)

## ArgoCD

Bom já que agora tenho um cluster porque não implementar GitOps com o ArgoCD? Configurei o ArgoCD dentro do cluster e apontei para o Gitlab, e para um teste inicio fiz a implementação de um yaml para deployment de Agents do VSTS ou melhor Azure DevOps.
{: .text-justify}
![ArgoCD]({{site.url}}\assets\images\homelab-Part-1\1687610385524.png)

Bom, resumindo o fluxo do GitOps, localmente faço a edição de um yaml contendo um StateFullSet, realizo o commit e push para o repo no Gitlab, e diretamente o ArgoCD realiza o sync com o repo, e na sequência faz o deploy do yaml no cluster automaticamente.
{: .text-justify}
![ArgoCD]({{site.url}}\assets\images\homelab-Part-1\1687610446691.png)

E como consequência já temos os Agents online no VSTS, podemos alterar o número de réplicas para quantos precisarmos: 
{: .text-justify}
![ArgoCD]({{site.url}}\assets\images\homelab-Part-1\1687610549266.png)


## Conclusão 
Temos agora um cluster Kubernetes para estudo, junto com ele temos o Proxmox para estudo da infra, e o ArgoCD para estudo do GitOps. Nessa presente data já fiz mais testes e tem mais softwares configurados dentro do Proxmox como Firewall Fortigate VM em sua licença always free, Jellyfin estação multimídia e Navidrome reprodutor de música.
Para mais artigos como esse comentem abaixo, artigos com detalhes sobre como instalar Proxmox, configurar o microk8s, ArgoCD, Lens, VSTS Agent, Vaultwarden e etc.
{: .text-justify}

## Referências e Links uteis:
<https://github.com/ChristianLempa/cheat-sheets>

<https://microk8s.io/docs/getting-started>

<https://microk8s.io/docs/high-availability>

<https://www.proxmox.com/en/proxmox-ve>

<https://argo-cd.readthedocs.io/en/stable/>

<https://k8slens.dev/>

<https://gitlab.com/homelab731022/microk8s-argocd>


