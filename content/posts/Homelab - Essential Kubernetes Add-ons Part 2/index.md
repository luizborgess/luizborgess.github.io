---
title: "Homelab - Essential Kubernetes Add-ons Part 2"
date: 2024-08-24
draft: false
author: Luiz Borges
tags: [Kubernetes, Homelab, k8s, Proxmox, Virtualização, Linux, ArgoCD, CertManager, ExternalDNS]
---


![Bryce Canyon National Park](0tDp9zAeI.jpg)

No [artigo](https://www.linkedin.com/pulse/homelab-add-ons-essenciais-para-kubernetes-parte-1-borges-ldkvf) anterior, instalamos o CNI no cluster Kubernetes, configuramos o network load balancer MetalLB e implementamos um Ingress Controller. No entanto, ainda não conseguimos obter um endereço HTTPS ou expor nossos serviços na internet sem associar um domínio. Nesta segunda parte, nosso objetivo é resolver essas questões, começando pela obtenção de certificados ACME. Para isso, utilizaremos o Certificate Manager, que gerencia automaticamente os certificados no cluster. Além disso, para automatizar a criação de domínios para cada aplicação, utilizaremos o External-DNS. Por fim, vamos configurar o Argo CD, validando assim os dois add-ons mencionados anteriormente. Lembre-se de que, para seguir este artigo, é necessário ter um cluster Kubernetes já configurado, um domínio registrado, e acesso ao registro desse domínio.

## Helm

Antes de mais nada precisamos instalar ferramenta helm, pois iremos utilizar-la para instalar os add-ons.

> Helm é uma ferramenta de pacotes para Kubernetes que facilita a implantação e gerenciamento de aplicações usando "charts" pré-configurados. Ele simplifica atualizações, automatiza tarefas repetitivas, e suporta versionamento e rollback de releases para uma gestão eficiente.

A instalação do helm vai depender do sistema operacional que está utilizando, para isso nos referimos a [documentação](https://helm.sh/docs/intro/install/), e no nosso caso com o Fedora/RHEL utilizamos o dnf:

```
sudo dnf install helm
```

Após instalado, já podemos instalar charts no nosso cluster, e o primeiro que vamos instalar é o cert-manager.

## Cert-manager

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQErJABIBXWpHQ/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1720563010883?e=1778112000&v=beta&t=JK-dK6krbzMoFtZFwbLEKzWTbFZIlF9qUj6QQTsKl1w)

Conteúdo do artigo

Para instalar o chart do cert-manager, primeiro precisamos adicionar o seguinte repositório:

```
helm repo add jetstack https://charts.jetstack.io --force-update
```

Na sequência, após o repositório adicionado, aplicamos de fato:

```
helm install \
cert-manager jetstack/cert-manager \
 --namespace cert-manager \
 --create-namespace \
 --version v1.15.1 \
 --set crds.enabled=true
```

Após a instalação, precisamos configurá-lo, começando pela definição do nosso emissor de certificados (Issuer). Embora seja possível utilizar um certificado self signed ou até mesmo o HashiCorp Vault para emitir os certificados, optaremos por usar o ACME Let's Encrypt, que é o Issuer mais comum.

Uma vez escolhido o Issuer, é necessário entender como será realizado o challenge, que serve para verificar se você é realmente o proprietário do domínio. A documentação apresenta duas formas de challenge, http01 e dns01, que foram simplificadas abaixo:

- **http01**: Exige um endpoint HTTP acessível na internet, para que o servidor ACME possa consumir a chave exposta, finalizando o challenge e comprovando a propriedade do domínio.
- **dns01**: Nesse tipo de challenge, são fornecidas credenciais para que o Cert-Manager realize chamadas à API do registrador e grave registros TXT para validar a propriedade do domínio.

Portanto, no nosso caso de exemplo, utilizamos o register da cloudflare, vamos escolher o segundo método DNS01, e temos pontos de atenção que são os dois tipos de autenticação em sua api, api tokens e api keys, vamos utilizar nesse artigo API Tokens por ser mais seguro do que o outro método. Caso seu register for diferente, o cert-manager suporta diversos outros tipos de registers, como Akamai, AzureDNS, Route53, Google DNS e outros.

A configuração que iremos realizar pode ser ajustada para o register que você estiver utilizando. Se estiver usando um diferente do nosso, é recomendável consultar a [documentação](https://cert-manager.io/docs/configuration/acme/dns01/) do Cert-Manager. Geralmente, o procedimento envolve criar um segredo e, em seguida, configurar o Cluster Issuer.

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFY8oB3GXTUmA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1722634810465?e=1778112000&v=beta&t=8y5PlXZWmoAtoykbz2X6Mn4PsIcL0YaLeli3inV0c0U)

Conteúdo do artigo

> Obs: Todos os.yaml do artigo estão disponíveis no seguinte [repositório GitHub](https://github.com/luizborgess/homelab).

Devemos se atentar a referencia do secret, nas duas ultimas linhas, deve se referir ao nome do secret, e o tipo da key que no caso é api-token. Após salvar o arquivo acima, basta aplicar com:

```
kubectl -f apply cert-manager.yaml -n cert-manager
```

Em seguida, para verificar o funcionamento do issuer, basta executar o comando abaixo:

```
kubectl describe clusterissuer cloudflare-issuer
```

Deverá ter algo parecido no campo de status:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4E12AQHtV85FJRsvpw/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1724190083430?e=1778112000&v=beta&t=vNdlYFnfr26NhHg0T28JyHY2EIHFOPJkDH5LWYBKgU8)

Conteúdo do artigo

Guarde o seguinte valor de annotation para automatizar a criação de certificados no nosso *ingress* adiante:

```
cert-manager.io/cluster-issuer: cloudflare-issuer
```

## External-dns

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFrul8lsNyX3w/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1720563367084?e=1778112000&v=beta&t=UwDC7l633nPkE1_-xAmKW-sJPjqIRkBGzvFqQvKfkuo)

Conteúdo do artigo

Continuando, vamos utilizar o external-dns para automatizar a criação do dns no register da cloudflare, e desta vez, vamos utilizar do mesmo API TOKEN criado na cloudflare, mas vamos configurar um novo secret para segregar do cert-manager:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQEUdHfjrxZcPg/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1722781634376?e=1778112000&v=beta&t=cJ6soOZHyJB9mah9pkfnehyRj4tnMLRTSv7UlmF-1So)

Conteúdo do artigo

Após aplicado o secret, precisamos definir nossos values, para setar o provider como cloudflare, e claro apontando para o secret criado.

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFxLGfA2WehmA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1722781774068?e=1778112000&v=beta&t=ZyK5U8Qt4yanorWtY_10dCheXFQxQ9QsHYFPe6wKBQM)

Conteúdo do artigo

Com os values criados, vamos instalar o external-dns com os seguintes comandos:

```
helm repo add external-dns https://kubernetes-sigs.github.io/external-dns/

helm repo update

helm upgrade --install external-dns external-dns/external-dns --values external-dns-values.yaml
```

Apos feito isso, basta aguardar o pod subir, e já poderemos validar logo adiante, para isso vamos utilizar o seguinte annotation abaixo:

```
external-dns.alpha.kubernetes.io/hostname: argocd.hlspace.org
```

## Argocd

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4E12AQE8OYaGts3seA/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1724190979715?e=1778112000&v=beta&t=jlK2tSUtbuvbM1CNXjpWPutTneDV_myM1bJjzxqPgkw)

Conteúdo do artigo

Após instalado cert-manager e o external-dns, precisamos subir algo para validar o funcionamento dos dois add-ons, e para isso, vamos instalar o último add-on do artigo o ArgoCD.

> O **Argo CD** é uma ferramenta GitOps para Kubernetes que automatiza o gerenciamento e a sincronização de aplicativos declarados em repositórios Git, garantindo que o estado do cluster esteja sempre alinhado com a configuração versionada.

Para configurar o argocd em nosso cluster, vamos utilizar o helm, mas antes vamos criar nosso *argocd-values.yaml,* para já subir com um ingress, lembre-se de incluir os annotations dos dois add-ons anteriores, e substituir [hlspace.org](http://hlspace.org/), pelo seu domínio.

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQGQJkEk0wGQuw/article-inline_image-shrink_1500_2232/article-inline_image-shrink_1500_2232/0/1723545691293?e=1778112000&v=beta&t=42AJ2gIlIae0RzQRFvclePOad2Hq516cB_LTk2YlB60)

Conteúdo do artigo

Nesse value determinamos a criação do ingress, do certificado para uso no ingress utilizando o cert-manager, e do registro dns na cloudflare utilizando external-dns. Agora basta criarmos um namespace e subir o chart utilizando os values acima:

```
kubectl create namespace argocd
helm repo add argo https://argoproj.github.io/argo-helm
helm install argo-cd argo/argo-cd --version 7.4.3 -n argocd -f argocd-values.yaml
```

Após poucos minutos já podemos acessar o argocd em HTTPS, conforme imagem abaixo:

![Conteúdo do artigo](https://media.licdn.com/dms/image/v2/D4D12AQFqBqjBHHyrsA/article-inline_image-shrink_1000_1488/article-inline_image-shrink_1000_1488/0/1720563631291?e=1778112000&v=beta&t=S6lWoOmB4KYuuVzoJ1AXTddf5Ilab2VlU81v2KeDKxs)

Conteúdo do artigo

Para logar, o usuário é admin e a senha pode ser obtida pelo comando abaixo:

```
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## Conclusão:

Após a instalação dos add-ons, nosso cluster HA está pronto para receber aplicações expostas via HTTPS. A configuração do cert-manager e do external-dns automatiza e simplifica os deployments, permitindo gerenciar certificados e domínios com apenas algumas annotations nos manifests. Em cenários onde HTTPS é obrigatório, essa automação previne problemas comuns com a renovação e substituição de certificados. Para complementar e integrar o GitOps, também instalamos o ArgoCD, utilizado no artigo para validar os primeiros dois add-ons, mas que em ambientes reais pode gerenciar o continuous deployment do cluster em conjunto com repositórios Git. Contudo, além dos add-ons discutidos, vale mencionar outras ferramentas importantes que não foram detalhadas:

- **Chaos Mesh**: Simula falhas no Kubernetes para testar a resiliência de sistemas.
- **Trivy**: Scanner de vulnerabilidades para contêineres e infraestrutura como código.
- **Keda**: Escala aplicações no Kubernetes com base em eventos externos.
- **Longhorn**: Armazenamento distribuído nativo do Kubernetes com alta disponibilidade.
- **Traefik Ingress Controller**: Controla o tráfego de entrada para serviços no Kubernetes. Alternativa ao nginx ingress controller.
- **Flux CD**: Plataforma GitOps que facilita o gerenciamento de fluxos e CRDs no Kubernetes.
- **Grafana + Prometheus**: Stack de monitoramento para coleta e visualização de métricas em Kubernetes, oferecendo monitoramento e alertas detalhados.

## Referencias:

[https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/](https://cert-manager.io/docs/configuration/acme/dns01/cloudflare/)

[https://artifacthub.io/packages/helm/argo/argo-cd](https://artifacthub.io/packages/helm/argo/argo-cd)

[https://artifacthub.io/packages/helm/external-dns/external-dns](https://artifacthub.io/packages/helm/external-dns/external-dns)

[https://argo-cd.readthedocs.io/en/stable/user-guide/helm/](https://argo-cd.readthedocs.io/en/stable/user-guide/helm/)

[https://www.cloudflare.com/pt-br/products/registrar/](https://www.cloudflare.com/pt-br/products/registrar/)

[https://kubernetes.io/docs/home/](https://kubernetes.io/docs/home/)