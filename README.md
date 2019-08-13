# 클라우드 컨테이너 환경에서 Back-end API 구성하기 AtoZ

[TOC]

## 개요

이 세션은 도커(Docker), 컨테이너(Container), AWS가 무엇인지 선행 기초 지식이 있다는 가정 하에 설명하고 있습니다. 세션에 참여하시기 전에 꼭 위의 세가지에 대하여 학습하신 후 참석해주시기 바랍니다.

![img](https://d2fipm9e6ilyxz.cloudfront.net/ecs-objects-taskdef-1aba4ac72a5c999e0cb74833a18e6289eb71d32a.png)

## AWS의 컨테이너 서비스

AWS의 Container Services 목록은 아래와 같습니다.

- [ECS](https://aws.amazon.com/ko/ecs/?nc2=h_m1)(Elastic Container Service)
- [Fargate](https://aws.amazon.com/ko/fargate/?nc2=h_m1)(Serverless Container)
- [EKS](https://aws.amazon.com/ko/eks/?nc2=h_m1)(Elastic Kubernetes Service)

우리가 사용할 서비스는 ECS입니다.

## 첫번째, 개발 환경을 구성해봅시다.

이제 우리는 간단한 REST API를 구성해보겠습니다. [JSON Server](https://github.com/typicode/json-server) 라고하는 간단한 API가 있습니다. 도입은 간단하게라는 제 신조에 따라 우선은 Docker Hub에 올라와 있는 [clue/json-server](https://hub.docker.com/r/clue/json-server) 를 사용하여 로컬 환경을 구성해보겠습니다.

각자 자신의 Workspace 경로에서 `amathon-session` 이름의 디렉토리를 만들어주세요. 원활한 진행을 위해서 디렉토리 이름은 통일해주시기 바랍니다.

### docker-compose

`amathon-session` 이라는 디렉토리를 만드셨으면 디렉토리 안에 `docker-compose.yml` [^docker-compose]라는 파일을 만들어주세요.

[^docker-compose]:docker에서 container를 실행시키는 옵션들을 파일로 관리하여 컨테이너 간 실행 순서, 의존성 등을 관리할 수 있는 도구입니다.

이제 아래의 내용을 `docker-compose.yml` 파일 안에 Copy&Paste 해주시기 바랍니다. `docker-compose.yml`은 YAML 파일 형식을 따르고 있습니다. YAML 파일에 대해서 잘 모르시는 분은 [#링크](https://ko.wikipedia.org/wiki/YAML)를 참고해주세요.

```yaml
# amathon-session/docker-compose.yml
version: '3' # docker-compose에서 인식할 yml 파일의 버전입니다. 1.x, 2.x, 3.x
services: # 실행할 컨테이너들의 목록입니다.
  json-server: # 실행할 컨테이너의 이름입니다.
    image: clue/json-server # 실행할 도커 이미지 이름입니다.
    ports: # Host와 Container간의 Port를 맵핑 시켜줍니다.
      - '80:80'
```

JSON Server는 json 파일이 필요합니다. 디렉토리 안에 `articles.json` 파일도 만들고 아래 내용을 붙여넣기 해주세요.

그리고 `docker-compose.yml` 파일을 수정해주세요.

```yaml
# amathon-session/docker-compose.yml
...
services:
  json-server:
    ...
    command: # args를 통해 json dump를 초기화해줍니다.
      - "http://jsonplaceholder.typicode.com/db"
```

그럼 이제 디렉토리 안에는 다음의 파일이 있습니다.

```
amathon-session
└── docker-compose.yml
```

Test를 위해 터미널에서 `$ docker-compose up -d`를 실행하고 http://localhost:3000에 들어가서 잘 되는지 확인해주세요.

## 두번째, API를 ECS에 배포해봅시다.

### 1. `ecs-cli`를 설치해줍니다. [#](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/ECS_CLI_installation.html)

`ecs-cli` 는 터미널에서 ecs를 관리할 수 있게 해주는 커맨드 도구입니다.

#### macOS

```shell
$ sudo curl -o /usr/local/bin/ecs-cli https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-darwin-amd64-latest
$ sudo chmod +x /usr/local/bin/ecs-cli
```

#### Linux

```shell
$ sudo curl -o /usr/local/bin/ecs-cli https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-linux-amd64-latest
$ sudo chmod +x /usr/local/bin/ecs-cli
```

#### Windows

```powershell
PS C:\> New-Item ‘C:\Program Files\Amazon\ECSCLI’ -type directory
PS C:\> Invoke-WebRequest -OutFile ‘C:\Program Files\Amazon\ECSCLI\ecs-cli.exe’ https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-windows-amd64-latest.exe
PS C:\> C:\existing\path;C:\Program Files\Amazon\ECSCLI
```

#### 설치 확인

```shell
ecs-cli --version
```

### 2. 클러스터 생성

클러스터(Cluster)는 ECS의 가장 기본적인 단위입니다. 도커 컨테이너를 실행 할 수 있는 가상의 공간입니다. 프로젝트에 따라서 나누는 등 사용이 가능합니다. 이제 클러스터를 생성해보겠습니다.

![img](https://d2fipm9e6ilyxz.cloudfront.net/ecs-objects-cluster-5cb589f255f9a00805c901a64e856019185a2491.png)

1. 먼저 클러스터를 구성해야합니다.

```shell
$ ecs-cli configure --cluster amathon-session --region ap-northeast-2 --default-launch-type EC2 --config-name amathon-session
INFO[0000] Saved ECS CLI cluster configuration amathon-session. 
```

```shell
$ ecs-cli configure profile --access-key {ACCESS_KEY} --secret-key {SECRET_KEY} --profile-name {PROFILE_NAME}
```

2. 클러스터를 생성합니다.

```shell
$ ecs-cli up --capability-iam --size 1 --instance-type t2.micro --cluster-config amathon-session
WARN[0000] You will not be able to SSH into your EC2 instances without a key pair. 
INFO[0000] Using recommended Amazon Linux 2 AMI with ECS Agent 1.29.1 and Docker version 18.06.1-ce 
INFO[0000] Created cluster                               cluster=amathon-session region=ap-northeast-2
INFO[0000] Waiting for your cluster resources to be created... 
INFO[0000] Cloudformation stack status                   stackStatus=CREATE_IN_PROGRESS
INFO[0061] Cloudformation stack status                   stackStatus=CREATE_IN_PROGRESS
INFO[0121] Cloudformation stack status                   stackStatus=CREATE_IN_PROGRESS
VPC created: vpc-0cb6623394a03464b
Security Group created: sg-0303c70aa995e8d0c
Subnet created: subnet-0c0ebd09388877c0a
Subnet created: subnet-0d93584df751b29d8
Cluster creation succeeded.
```

### 3. 클러스터에 Compose 파일 배포

Compose 파일을 배포하기 전에 Compose 파일을 수정해야합니다. **ecs에서는 docker-compose 파일 구문 버전 1, 2, 3을 지원합니다.** 우리는 3을 이용해서 작업을 하고 있습니다. ECS CLI는 compose 파일에서 여러 파라미터를 지원합니다. 우선적으로 Logging 연결해볼까요?

```yaml
# amathon-session/docker-compose.yml
version: '3'
services:
  json-server:
  	...
    logging:
      driver: awslogs
      options: 
        awslogs-group: amathon-session
        awslogs-region: ap-northeast-2
        awslogs-stream-prefix: amathon
```

Docker Compose Version 3에서는 CPU 및 메모리 사양을 따로 지정해야합니다.

```yaml
# amathon-session/ecs-params.yml
version: 1
task_definition:
  services:
    json-server:
      cpu_shares: 100
      mem_limit: 524288000
```

`ecs-cli compose up`을 이용하여 compose 파일을 배포할 수 있습니다.

```shell
$ ecs-cli compose up --create-log-groups --cluster-config amathon-session
INFO[0000] Using ECS task definition                     TaskDefinition="amathon-session:1"
INFO[0000] Created Log Group amathon-session in ap-northeast-2 
INFO[0000] Starting container...                         container=96fbb9e3-ba11-43a1-9eab-b75ab18770db/json-server
INFO[0000] Describe ECS container status                 container=96fbb9e3-ba11-43a1-9eab-b75ab18770db/json-server desiredStatus=RUNNING lastStatus=PENDING taskDefinition="amathon-session:1"
INFO[0012] Describe ECS container status                 container=96fbb9e3-ba11-43a1-9eab-b75ab18770db/json-server desiredStatus=RUNNING lastStatus=PENDING taskDefinition="amathon-session:1"
INFO[0024] Started container...                          container=96fbb9e3-ba11-43a1-9eab-b75ab18770db/json-server desiredStatus=RUNNING lastStatus=RUNNING taskDefinition="amathon-session:1"
```

- `--cluster-config` 는 위에서 정의한 logging을 CloudWatch 로그 그룹을 만듭니다.

잘 배포가 됬는지 확인해봅시다.

```shell
$ ecs-cli ps --cluster-config amathon-session
Name                                              State                Ports                    TaskDefinition     Health
96fbb9e3-ba11-43a1-9eab-b75ab18770db/json-server  STOPPED ExitCode: 1  52.78.97.136:80->80/tcp  amathon-session:1  UNKNOWN
```



### 4. ECS 서비스 생성

ECS에서는 두가지 방식으로 작업을 실행할 수 있습니다. 첫번째 방법은 앞서 진행한 [3의 과정](#3) 처럼 작업정의(Task Definition)를 통해서 직접 작업을 실행하는 방법이 있습니다. 두번쨰는 지금 해볼 서비스입니다.

서비스는 클러스터 안에서 작업(Task)들을 관리해주는 역할을 합니다. 클러스터 안에서 서비스는 여러개로 나눠질 수 있습니다. 서비스는 선택적인 부분입니다. 그렇지만 서비스를 구성함으로써 작업을 안정적으로 효율적으로 관리할 수 있습니다.

![img](https://d2fipm9e6ilyxz.cloudfront.net/ecs-objects-service-5020584c57fd6ab4ff61dc0bc7e57cdc63684890.png)

1. 서비스 구성을 위해서는 빈 클러스터에서 작업해야하므로 터미널에서 명령어를 실행해줍니다.

1. 빈 클러스터에서 작업해야하므로 터미널에서 명령어를 실행해줍니다.

```shell
$ecs-cli compose down --cluster-config amathon-session
INFO[0001] Stopping container...                         container=1b9e43b4-6151-4c71-a722-81c3c7df3479/json-server
INFO[0001] Describe ECS container status                 container=1b9e43b4-6151-4c71-a722-81c3c7df3479/json-server desiredStatus=STOPPED lastStatus=RUNNING taskDefinition="amathon-session:15"
INFO[0013] Describe ECS container status                 container=1b9e43b4-6151-4c71-a722-81c3c7df3479/json-server desiredStatus=STOPPED lastStatus=RUNNING taskDefinition="amathon-session:15"
INFO[0025] Describe ECS container status                 container=1b9e43b4-6151-4c71-a722-81c3c7df3479/json-server desiredStatus=STOPPED lastStatus=RUNNING taskDefinition="amathon-session:15"
INFO[0037] Stopped container...                          container=1b9e43b4-6151-4c71-a722-81c3c7df3479/json-server desiredStatus=STOPPED lastStatus=STOPPED taskDefinition="amathon-session:15"
```

2. 이제 서비스를 구성해줍니다. 서비스 이름은 `amathon-session-rest-api` 로 하겠습니다.

```shell
$ ecs-cli compose --project-name amathon-session-rest-api service up --cluster-config amathon-session
INFO[0000] Using ECS task definition                     TaskDefinition="amathon-session-rest-api:1"
INFO[0000] Created an ECS service                        service=amathon-session-rest-api taskDefinition="amathon-session-rest-api:1"
INFO[0000] Updated ECS service successfully              desiredCount=1 serviceName=amathon-session-rest-api
INFO[0015] Service status                                desiredCount=1 runningCount=1 serviceName=amathon-session-rest-api
INFO[0015] (service amathon-session-rest-api) has started 1 tasks: (task 4cc77380-6b9a-4c89-a09a-7f4d2db1d15b).  timestamp="2019-08-13 06:28:37 +0000 UTC"
INFO[0015] (service amathon-session-rest-api) has reached a steady state.  timestamp="2019-08-13 06:28:47 +0000 UTC"
INFO[0015] ECS Service has reached a stable state        desiredCount=1 runningCount=1 serviceName=amathon-session-rest-api
```

3. 잘 배포가 되었는지 다시 확인해 봅시다.

```shell
$ ecs-cli ps --cluster-config amathon-session                                     
Name                                              State                                                                                                                                                                                                                                                                            Ports                     TaskDefinition              Health
4cc77380-6b9a-4c89-a09a-7f4d2db1d15b/json-server  RUNNING                                                                                                                                                                                                                                                                          13.125.81.164:80->80/tcp  amathon-session-rest-api:1  UNKNOWN
1b9e43b4-6151-4c71-a722-81c3c7df3479/json-server  STOPPED ExitCode: 137                                                                                                                                                                                                                                                            13.125.81.164:80->80/tcp  amathon-session:15          UNKNOWN
```



## AWS에 Back-end API

- 

## 하태하태, GraphQL API

- 

## 마무으리



## Reference

- [Amazon ECS CLI 설치](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/ECS_CLI_installation.html)
- [Docker compose 파일 구문 사용](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/cmd-ecs-cli-compose-parameters.html)
- [ecs-cli compose](https://docs.aws.amazon.com/ko_kr/AmazonECS/latest/developerguide/cmd-ecs-cli-compose.html)