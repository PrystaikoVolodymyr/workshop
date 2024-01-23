Припустимо, у нас є інтернет-магазин. Ми зберігаємо дані про покупців у колекції mongodb. Ці дані містять багато конфіденційної особистої інформації. Щоб забезпечити максимальну безпеку, ми хочемо, щоб розробники мали доступ до свіжих записів у цій колекції, але не мали доступу до персональних даних.

Для вирішення цієї задачі вам потрібно створити сервіс, який буде стежити за появою та зміною документів у цій колекції та копіювати їх в іншу, анонімізуючи при цьому частину полів.


# Workshop Application

This Node.js application uses Apollo GraphQL, Express, TypeScript, and MongoDB. It generates random customer data, stores it in MongoDB, and provides a GraphQL API.

## Prerequisites

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/try/download/community)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/PrystaikoVolodymyr/workshop.git

2. Install dependencies:
    ```bash
    npm install

3. Create a .env file in the project root

## Building and Running

1. Build TypeScript:
   ```bash
   npm run build

2. Production Mode
   ```bash
   npm start
Visit http://localhost:3000 for the GraphQL API.

3. Development Mode
   ```bash
   npm run dev
Visit http://localhost:3000 for the GraphQL API.


## .env example

```
DB_URI=mongodb://localhost:27017/
DB_NAME=workshop
PORT=3000
```
