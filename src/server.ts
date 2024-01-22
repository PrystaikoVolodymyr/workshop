import express from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { MongoClient } from 'mongodb'
import cors from 'cors'
import { faker } from '@faker-js/faker'
import * as dotenv from 'dotenv'
dotenv.config()

const mongoURI = process.env.DB_URI || ''
const dbName = process.env.DB_NAME || ''
const port = process.env.PORT || 3000

interface ChangeEvent<T> {
    operationType: string
    fullDocument?: T
}

interface Customer {
    id?: string
    firstName: string
    lastName: string
    email: string
    address: {
        line1: string
        line2: string
        postcode: string
        city: string
        state: string
        country: string
    }
    createdAt?: Date
    updatedAt?: Date
}

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
`

function generateRandomString(length: number): string {
    const characters: string =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const charactersLength: number = characters.length

    return Array.from({ length }, () => {
        const randomIndex: number = Math.floor(Math.random() * charactersLength)
        return characters.charAt(randomIndex)
    }).join('')
}

function anonymizeData(data: Customer): Customer {
    data.firstName = generateRandomString(8)
    data.lastName = generateRandomString(8)
    data.email = anonymizeEmail(data.email)
    data.address.line1 = generateRandomString(8)
    data.address.line2 = generateRandomString(8)
    data.address.postcode = generateRandomString(8)

    return data
}

function anonymizeEmail(email: string): string {
    const [[], domain] = email.split('@')
    const anonymizedLocalPart = generateRandomString(8)
    return `${anonymizedLocalPart}@${domain}`
}

function generateCustomersBatch(): Customer[] {
    const batch: Customer[] = []
    const batchSize: number = Math.floor(Math.random() * 10) + 1

    for (let i = 0; i < batchSize; i++) {
        batch.push({
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: faker.internet.email(),
            address: {
                line1: faker.location.streetAddress(),
                line2: faker.location.secondaryAddress(),
                postcode: faker.location.zipCode(),
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
            },
            createdAt: new Date(),
        })
    }

    return batch
}

const custom_server = async () => {
    const client = await MongoClient.connect(mongoURI)
    const db = client.db(dbName)

    const customersCollection = db.collection('customers')
    const customersAnonCollection = db.collection('customers_anonymised')

    const resolvers = {
        Query: {
            customers: async () => {
                return customersAnonCollection.find().limit(10).toArray()
            },
        },
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers,
    })
    await server.start()

    const app = express()

    app.use(cors())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use('/', expressMiddleware(server))

    setInterval(() => {
        const customersBatch = generateCustomersBatch()
        customersCollection.insertMany(customersBatch)
        console.log('add 10')
    }, 200)

    const changeStream = customersCollection.watch()

    changeStream.on('change', (change: ChangeEvent<any>) => {
        if (
            change.operationType === 'insert' ||
            change.operationType === 'update'
        ) {
            const anonymizedData = anonymizeData(change.fullDocument)
            customersAnonCollection.insertOne(anonymizedData)
        }
    })

    app.listen(port, () => {
        console.log(`ready to http://localhost:${port}`)
    })
}

custom_server().then()
