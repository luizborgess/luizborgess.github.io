---
title: "Homelab - Essential Kubernetes Add-ons Part 1"
date: 2024-07-10
draft: false
author: Luiz Borges
tags: [Homelab, Kubernetes, K8s, Proxmox, VM, Linux, Calico, MetalLB]
---



![Bryce Canyon National Park](DKix6Un55mw.jpg)

No primeiro [artigo](https://www.linkedin.com/pulse/homelab-utilizando-proxmox-e-configurando-kubernetes-com-borges/), utilizamos um Lenovo Thinkpad T470. Devido à limitação de memória, migramos o servidor Proxmox para um hardware mais robusto, com 32 GB de RAM, um Xeon E5 de 2015 e um sonho - brincadeiras à parte. Esta atualização foi necessária para criar um cluster Kubernetes com alta disponibilidade, mesmo que virtualizado, pois é um único host físico. O propósito deste artigo é demonstrar os add-ons essenciais para o funcionamento básico de um cluster Kubernetes. O artigo será dividido em duas partes de um webserver nginx: uma para HTTP e a segunda \[link em breve\] para HTTPS. Mas antes de entrar no assunto principal, precisamos falar dos requisitos.

## Setup

Para a instalação dos add-ons, primeiramente, instalamos o Kubernetes seguindo sua documentação oficial, utilizando o kubeadm:

[https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)

Existem modos mais simples de implementação de um cluster Kubernetes, como usar distribuições como microk8s, minikube ou k3s. A arquitetura do cluster será composta por um control plane e dois worker nodes. Basicamente, instalamos o kubelet, kubeadm e kubectl nos três nodes, iniciamos o cluster no control plane e realizamos o *join* dos worker nodes nesse control plane. Resultando na simples arquitetura abaixo:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQHvPgheVz2nkQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720609560448?e=1778112000&v=beta&t=orQDIRGc6mPMcCyJFGwkEneD-yTW2ijNUB9wCe9o5eE)

Conteúdo do artigo

Para atender a essa configuração, foram criadas três VMs no Proxmox com a seguinte especificação:

***ControlPlane:***

- vCPUs: 2
- Memory: 6Gb
- OS: Ubuntu Server 22.04.4
- Kubeadm: v1.26.15

***Workers:***

- vCPUs: 4
- Memoy: 8Gb
- OS: Ubuntu Server 22.04.4
- Kubeadm: v1.26.15

Com o cluster montado, enfrentamos um problema já esperado: nada funcionará sem um CNI (Container Network Interface). Portanto, o primeiro passo é a instalação de um CNI. Você pode escolher o de sua preferência, conforme indicado na documentação oficial:

[https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy](https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy)

## Calico

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQEG2ZvLaarXJQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720562672550?e=1778112000&v=beta&t=kA0VWZg0X-ByDu0Jfoob6G9fRdpFo_PKQp4Atfyk3xc)

https://www.tigera.io/project-calico/

O CNI escolhido da vez foi o Calico, devido ao seu excelente suporte para HA (*High Availability*) e já havíamos utilizado o mesmo antes, visto que vem por padrão na distribuição do microk8s.

> Calico é uma solução de rede para Kubernetes que oferece conectividade e segurança entre contêineres, pods e outros componentes. Utilizando um modelo de rede baseado em IP, Calico atribui endereços IP únicos a cada contêiner, facilitando o gerenciamento do tráfego. Ele permite definir políticas de rede detalhadas para controlar a comunicação entre pods, melhorando a segurança. Conhecido por sua alta performance e baixa latência, Calico suporta tanto redes de sobreposição quanto de não-sobreposição, tornando-se uma escolha popular para gerenciar redes em clusters Kubernetes.

A instalação do Calico é bem simples basta instalar o operator no cluster:

```
kubectl create -f https://raw.githubusercontent.com/projectcalico/calico/v3.28.0/manifests/tigera-operator.yaml
```

Após a instalação do operator, é necessário realizar a configuração específica para o nosso cluster. Uma configuração incorreta pode acarretar no não funcionamento do CNI. Dessa forma, o arquivo de configuração do Calico utilizado foi o seguinte:

> PS: Os arquivos yaml em foto, estão disponibilizados no repositório: [https://github.com/luizborgess/homelab](https://github.com/luizborgess/homelab)

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQE7f-hgl4rWaA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720611437938?e=1778112000&v=beta&t=khESXQQB2o8UWsI3IgOeS15ZqkRlejeG2WpGyGlk4gg)

Conteúdo do artigo

Para simplificar o networking do cluster, e como estamos em uma única máquina bare metal, desativamos o BGP. Outra alteração foi modificar o encapsulation de VXLANCrossSubnet para VXLAN, já que vamos utilizar uma única subnet em ambiente on-premises. A configuração VXLANCrossSubnet é geralmente usada para setups na nuvem com subnets diferentes. No campo de CIDR, deve-se especificar um IP diferente do da rede local para os endereços IPs do cluster. Essa configuração não pode sobrepor o range da rede local; por exemplo, redes locais geralmente utilizam IPs como 192.168.x.x ou 172.30.x.x. Portanto, um exemplo de range de IPs recomendado seria 10.244.1.0/24.

Por fim basta aplicar a configuração:

```
kubectl create -f calico-config.yaml
```

Com o seguinte comando conseguimos distinguir os IPs:

```
kubectl describe node controlplane-name
```

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFuzjVQKNsjVQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720612176965?e=1778112000&v=beta&t=p7Hor8Jyw6jxcQRSJX21tEO8M2QDdbQCKH3yK5_yAek)

Conteúdo do artigo

Finalmente veremos se o Calico esta funcionando:

```
kubectl get pods -n calico-system | grep calico-node
```

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQG7vTRc_amYNQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720612309918?e=1778112000&v=beta&t=jgFAzS4ECV_Z5iJGl7uad1RpuTEOtkrs9ROsrwVrB0I)

Conteúdo do artigo

Neste ponto, todos os nossos nodes devem entrar em status "Ready", caso isso não aconteça, pode ser que ainda existam problemas de networking. Uma dica de troubleshooting é verificar os logs do csi-node-driver\* e do kubelet de cada node para identificar possíveis logs de error relacionados ao CNI ou de não reconhecimento dentre os nodes. Outro problema comum no node discovery pode ser a resolução de nomes entre nodes. Caso tenha esquecido disso durante o join, verifique o arquivo /etc/hosts.

Agora que está tudo certo com o CNI, podemos subir nossos pods? Ainda não, porque para expor os pods do cluster, para que possam ser acessados de fora, uma alternativa seria utilizar service e realizar um *port forward*. No entanto, essa solução é válida apenas para testes. No mundo real usaríamos um ingress e para tal, será necessário instalar um ingress controller.

## Nginx Ingress Controller

Vamos utilizar o nginx ingress controller, uns dos mais comuns ingresses controllers para Kubernetes, você pode escolher dentre vários detalhados pela documentação, conforme seu caso de uso:

[https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/)

Nosso caso de uso aqui é simplesmente subir um webserver para validar os addons. Dito isso, partindo para instalação é bem simples se comparado o CNI, basta executar o seguinte comando abaixo para instalar o controller:

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
```

E na sequência, validamos se está rodando conforme imagem abaixo:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFeioG-ZhJuWA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720613121970?e=1778112000&v=beta&t=RnajqivcQ_YxBXr1l2fT7TYMPxo_qjlIscakFBjrwzc)

Conteúdo do artigo

Mas infelizmente ainda não é o suficiente, pois como estamos em on premisses não temos serviços de *load balancing on demand* assim como na cloud, AWS, Azure e GCP, por conta disso temos de subir como último passo um load balancer, mais precisamente um *network load balancer* que atua na layer 2, para nosso ingress funcionar de fato.

Segue abaixo as considerações da documentação para mais detalhes:

[https://kubernetes.github.io/ingress-nginx/deploy/baremetal/#a-pure-software-solution-metallb](https://kubernetes.github.io/ingress-nginx/deploy/baremetal/#a-pure-software-solution-metallb)

## Metallb

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQF-_qJhhOrAbA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720561775080?e=1778112000&v=beta&t=XWNwwl8cLmidXthRiuevzwEitoMmV8q-H7OGwQ37FMo)

https://metallb.universe.tf/

Continuando, o próximo add-on essencial é o MetalLB, que será a nossa solução para implementar um load balancer em um ambiente de servidor bare metal.

> MetalLB é uma solução de balanceamento de carga para Kubernetes que fornece suporte a IPs externos para serviços em clusters que não têm acesso a um balanceador de carga nativo, como clusters bare-metal. Ele implementa os protocolos ARP (Address Resolution Protocol) e BGP (Border Gateway Protocol) para distribuir tráfego de rede de forma eficiente entre os nós do cluster. MetalLB é fácil de configurar e integrar, permitindo que clusters Kubernetes em ambientes bare-metal tenham capacidades de balanceamento de carga comparáveis às de provedores de nuvem, melhorando a disponibilidade e escalabilidade dos serviços.

Para instalar o MetalLB é tão simples quanto instalar o controller, basta seguir a documentação do site oficial:

[https://metallb.universe.tf/installation/](https://metallb.universe.tf/installation/)

Após a instalação do MetalLB, é crucial ter atenção ao montar o configmap para garantir o funcionamento correto. O principal ponto de atenção é definir adequadamente o range de addresses no configmap, para evitar conflitos ou sobreposição com outros IPs locais em sua rede. Além disso, é recomendável isolar esse range do seu servidor DHCP para evitar a alocação desses IPs. Dito isso, o config-map utilizado ficou da seguinte forma:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQHvEDMQeBMYlA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720613868641?e=1778112000&v=beta&t=B8bGiBA9idf1YhtFDWLSgLktQWV6eMwvrdDS5mYyWOA)

Conteúdo do artigo

Basta aplicar com kubectl:

```
kubectl apply -f config-map-metallb.yaml
```

Por fim, mas não menos importante, foi necessário reiniciar todos os nodes do cluster para o metallb funcionar corretamente, acredito que tenha algo a ver com o container runtime e o provisionamento dos ips para com o host local, se você leitor souber deixa abaixo nos comentários. Pela imagem abaixo verificamos que foi atribuído nosso service o IP 192.168.1.241 (Dica: Salve esse ip para mas adiante).

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQGNsv8nBGCCTw/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720614157670?e=1778112000&v=beta&t=ClCsFZNcnyYOBXrK-tJlnMPOYiMcI3IURHrG_J5cO9A)

Conteúdo do artigo

A arquitetura com MetalLB ficou da seguinte forma, assim como descrito na [documentação](https://kubernetes.github.io/ingress-nginx/deploy/baremetal/#a-pure-software-solution-metallb) do nginx ingress controller.

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFCK-WjcdENxA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720562132221?e=1778112000&v=beta&t=083ho7f9dLyFm1lc9V2IDosuJ47gg1cRWAUyvBhh5p8)

https://kubernetes.github.io/ingress-nginx/deploy/baremetal/#a-pure-software-solution-metallb

## Validando os Add-ons

Enfim, com os add-ons instalados, onde um depende do outro para funcionar corretamente, vamos proceder com a criação de um Deployment do nginx com 3 réplicas, seguido por um Service que o expõe internamente, e um Ingress para direcionar o tráfego externo para esse Service. Abaixo estão os três manifestos YAML necessários:

nginx\_deployment.yaml

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQEB4MD1xeSOoQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720614477591?e=1778112000&v=beta&t=qpZ6NKpZ_uOFZNrYDIXw6mPvF5GsfGr2RIJsf2NAwzE)

Conteúdo do artigo

nginx\_service.yaml

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQGZhcchf5rs7w/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720614555824?e=1778112000&v=beta&t=cTKuIqMr9h0f4hFY0q2IkLIVM-eKcg3LYri9IaaCSsI)

Conteúdo do artigo

nginx\_ingress.yaml

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQEAi3Gb8IXY5Q/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720614626988?e=1778112000&v=beta&t=YegPKfmIBSjoslw597opMpTkAtBOxeMXRtNneEtf2sk)

Conteúdo do artigo

Basta aplicar todos os 3 arquivos com kubectl, e teremos os seguintes pods:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQGEzEPunJ9ukQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720614767788?e=1778112000&v=beta&t=FqxkAC3CLQj1Z-ek-kJCZOgEK_6lY2ji0g9ptAvwBgk)

Conteúdo do artigo

No manifesto de ingress, utilizamos o ingress controller do nginx definindo ele em ingressClassName: nginx, e também utilizamos em host um domínio que será assunto na segunda parte, mas por enquanto precisamos adicionar a seguinte entrada no hosts da maquina que será realizado o teste:

```
nginx.hlspace.org IP_ALOCADO_METALLB
```

Com isso, agora conseguimos acessar a página inicial do nginx e verificar em qual dos 3 pods ele está sendo servido, identificando-o pelo endereço IP exibido.

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFnm2yu1zE0Bw/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1720615002232?e=1778112000&v=beta&t=VphJi8evJo8Y78s1v5BbC1DGqSiHRgz0jvSx9sIBKf0)

Conteúdo do artigo

## Conclusão:

Nesta primeira parte, configuramos componentes base do cluster, como o CNI, essencial para redes. Para o ambiente on-premises, resolvemos o desafio do balanceamento de carga utilizando o MetalLB. Além disso, alcançamos a publicação de uma página Nginx em *high availability* com 3 réplicas distribuídas entre os 2 nós de trabalho previamente provisionados.

Considerando o estado atual do cluster, na próxima etapa, vamos utilizar a ferramenta Helm para instalar outros add-ons essenciais. Isso inclui um gerenciador de certificados, o cert-manager, um serviço para automatização da criação de registros DNS, o external-dns, e também configuraremos o Argo CD em https. Além da sugestão de diversos outros add-ons.

## Referencias:

[https://kubernetes.github.io/ingress-nginx/deploy/#quick-start](https://kubernetes.github.io/ingress-nginx/deploy/#quick-start)

[https://metallb.universe.tf/installation/](https://metallb.universe.tf/installation/)

[https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)

[https://docs.tigera.io/calico/latest/getting-started/kubernetes/self-managed-onprem/onpremises](https://docs.tigera.io/calico/latest/getting-started/kubernetes/self-managed-onprem/onpremises)

[https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy](https://kubernetes.io/docs/concepts/cluster-administration/addons/#networking-and-network-policy)