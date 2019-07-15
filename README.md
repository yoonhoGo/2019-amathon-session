# 클라우드 컨테이너 환경에서 Back-end API 구성하기 AtoZ

[TOC]

## 개요

이 세션은 도커(Docker), 컨테이너(Container), AWS가 무엇인지 선행 기초 지식이 있다는 가정 하에 설명하고 있습니다. 세션에 참여하시기 전에 꼭 위의 세가지에 대하여 학습하신 후 참석해주시기 바랍니다.

## AWS의 컨테이너 서비스

AWS의 Container Services 목록은 아래와 같습니다.

- [ECS](https://aws.amazon.com/ko/ecs/?nc2=h_m1)(Elastic Container Service)
- [Fargate](https://aws.amazon.com/ko/fargate/?nc2=h_m1)(Serverless Container)
- [EKS](https://aws.amazon.com/ko/eks/?nc2=h_m1)(Elastic Kubernetes Service)

우리가 사용할 서비스는 ECS입니다.

## 첫번째, 개발 환경을 구성해봅시다.

이제 우리는 간단한 REST API를 구성해보겠습니다. [JSON Server](https://github.com/typicode/json-server) 라고하는 간단한 API가 있습니다. 도입은 간단하게라는 제 신조에 따라 우선은 Docker Hub에 올라와 있는 [clue/json-server](https://hub.docker.com/r/clue/json-server) 를 사용하여 로컬 환경을 구성해보겠습니다.

각자 자신의 Workspace 경로에서 `amaton-session` 이름의 디렉토리를 만들어주세요. 원활한 진행을 위해서 디렉토리 이름은 통일해주시기 바랍니다.

### docker-compose

`amaton-session` 이라는 디렉토리를 만드셨으면 디렉토리 안에 `docker-compose.yml` [^docker-compose]라는 파일을 만들어주세요.

[^docker-compose]:docker에서 container를 실행시키는 옵션들을 파일로 관리하여 컨테이너 간 실행 순서, 의존성 등을 관리할 수 있는 도구입니다.

이제 아래의 내용을 `docker-compose.yml` 파일 안에 Copy&Paste 해주시기 바랍니다. `docker-compose.yml`은 YAML 파일 형식을 따르고 있습니다. YAML 파일에 대해서 잘 모르시는 분은 [#링크](https://ko.wikipedia.org/wiki/YAML)를 참고해주세요.

```yaml
# amaton-session/docker-compose.yml
version: '3' # docker-compose에서 인식할 yml 파일의 버전입니다. 1.x, 2.x, 3.x
services: # 실행할 컨테이너들의 목록입니다.
  json-server: # 실행할 컨테이너의 이름입니다.
    image: clue/json-server # 실행할 도커 이미지 이름입니다.
    ports: # Host와 Container간의 Port를 맵핑 시켜줍니다.
      - '3000:80'
```

JSON Server는 json 파일이 필요합니다. 디렉토리 안에 `articles.json` 파일도 만들고 아래 내용을 붙여넣기 해주세요.

```json
// amaton-session/articles.json
// 이 주석들은 제거해주세요. json은 기본적으로 주석을 제공하지 않습니다.
{
  "posts": [
    { "id": 1, "body": "foo" },
    { "id": 2, "body": "bar" }
  ],
  "comments": [
    { "id": 1, "body": "baz", "postId": 1 },
    { "id": 2, "body": "qux", "postId": 2 }
  ]
}
```

그리고 `docker-compose.yml` 파일을 수정해주세요.

```yaml
# amaton-session/docker-compose.yml
...
services:
  json-server:
    ...
    volumes: # Host, Container의 경로(파일)을 맵핑 시켜줍니다.
      - './articles.json:/data/db.json'
```

그럼 이제 디렉토리 안에는 두가지 파일이 있습니다.

```
amaton-session
├── articles.json
└── docker-compose.yml
```

Test를 위해 터미널에서 `$ docker-compose up -d`를 실행하고 http://localhost:3000에 들어가서 잘 되는지 확인해주세요.

## 두번째, API를 ECS에 배포해봅시다.

ECS에 배포하기에 앞서  모두 `docker` 를 실행시켜주세요. 도커가 실행 완료되었다면 `docker-compose.yml`[^docker-compose] 파일을 만들겠습니다. 



## AWS에 Back-end API

- 

## 하태하태, GraphQL API

- 