"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const mongodb_1 = require("mongodb");
const cors_1 = __importDefault(require("cors"));
const faker_1 = require("@faker-js/faker");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const mongoURI = process.env.DB_URI || '';
const dbName = process.env.DB_NAME || '';
const port = process.env.PORT || 3000;
const typeDefs = `#graphql
  type Query {
    customers: [Customer]
  }

  type Customer {
    firstName: String
    lastName: String
    email: String
    address: Address
  }

  type Address {
    line1: String
    line2: String
    postcode: String
    city: String
    state: String
    country: String
  }
`;
function generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const charactersLength = characters.length;
    return Array.from({ length }, () => {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        return characters.charAt(randomIndex);
    }).join('');
}
function anonymizeData(data) {
    data.firstName = generateRandomString(8);
    data.lastName = generateRandomString(8);
    data.email = anonymizeEmail(data.email);
    data.address.line1 = generateRandomString(8);
    data.address.line2 = generateRandomString(8);
    data.address.postcode = generateRandomString(8);
    return data;
}
function anonymizeEmail(email) {
    const [[], domain] = email.split('@');
    const anonymizedLocalPart = generateRandomString(8);
    return `${anonymizedLocalPart}@${domain}`;
}
function generateCustomersBatch() {
    const batch = [];
    const batchSize = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < batchSize; i++) {
        batch.push({
            firstName: faker_1.faker.person.firstName(),
            lastName: faker_1.faker.person.lastName(),
            email: faker_1.faker.internet.email(),
            address: {
                line1: faker_1.faker.location.streetAddress(),
                line2: faker_1.faker.location.secondaryAddress(),
                postcode: faker_1.faker.location.zipCode(),
                city: faker_1.faker.location.city(),
                state: faker_1.faker.location.state(),
                country: faker_1.faker.location.country(),
            },
            createdAt: new Date(),
        });
    }
    return batch;
}
const custom_server = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = yield mongodb_1.MongoClient.connect(mongoURI);
    const db = client.db(dbName);
    const customersCollection = db.collection('customers');
    const customersAnonCollection = db.collection('customers_anonymised');
    const resolvers = {
        Query: {
            customers: () => __awaiter(void 0, void 0, void 0, function* () {
                return customersAnonCollection.find().limit(10).toArray();
            }),
        },
    };
    const server = new server_1.ApolloServer({
        typeDefs,
        resolvers,
    });
    yield server.start();
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use('/', (0, express4_1.expressMiddleware)(server));
    setInterval(() => {
        const customersBatch = generateCustomersBatch();
        customersCollection.insertMany(customersBatch);
        console.log('add 10');
    }, 200);
    const changeStream = customersCollection.watch();
    changeStream.on('change', (change) => {
        if (change.operationType === 'insert' ||
            change.operationType === 'update') {
            const anonymizedData = anonymizeData(change.fullDocument);
            customersAnonCollection.insertOne(anonymizedData);
        }
    });
    app.listen(port, () => {
        console.log(`ready to http://localhost:${port}`);
    });
});
custom_server().then();
