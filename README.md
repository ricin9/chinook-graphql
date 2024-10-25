# Chinook GraphQL API

This repository hosts a GraphQL API built using Yoga and the Cloudflare D1 database, designed to run on Cloudflare Workers. The API is based on the Chinook Database, a sample dataset commonly used for learning SQL.

## Features

- GraphQL API for accessing [Chinook Database](https://www.kaggle.com/datasets/ranasabrii/chinook) data
- Built with Yoga GraphQL for flexible and efficient GraphQL functionality
- Runs on Cloudflare Workers for serverless deployment
- Uses Cloudflare D1 as the database solution

## Getting Started

### Prerequisites

- Node.js
- Pnpm
- Cloudflare account with Workers and D1 access

### Installation

Clone the repository:

```bash
git clone https://github.com/ricin9/chinook-graphql.git
cd chinook-graphql
```

Install dependencies:

```bash
pnpm install
```

## Technologies

- GraphQL Yoga - For creating a fast and flexible GraphQL API
- Cloudflare D1 - Managed SQL database based on SQLite
- Cloudflare Workers - Serverless environment for deploying web services
- Chinook Database - Sample data representing a digital media store, containing tables for artists, albums, media tracks, and more
- Drizzle ORM - has nice a relational api with type safety

## Project Structure

```
chinook-graphql/
├── drizzle/          # contains chinook database's schema in sql (commented for now)
├── src/
│ ├── db/             # Contains drizzle schema, and a database instance getter
│ ├── resolvers/      # Implementation of GraphQL resolvers defined in gql-typedefs.ts
│ ├── dataloaders.ts  # Implementation of all dataloaders used by the resolvers
│ ├── gql-typedefs.ts # GraphQL SDL
│ ├── gql-schema.ts   # GraphQL Schema (resolvers)
│ └── server.ts       # Entry point for the Cloudflare Worker
│ └── ....            # other files
├── wrangler.toml     # Cloudflare Wrangler configuration
└── package.json
```

## Environment Setup

### Set up Cloudflare D1 database:

- Create a D1 instance on your Cloudflare dashboard, or using the `wrangler` CLI

```bash
pnpm wrangler d1 create <database_name>
```

- Link the newly created D1 instance to this project by adding the binding in wrangler.toml:

```toml
[[d1_databases]]
binding = "DB"                        # Name used in the Worker
database_name = "<YOUR_D1_DB_NAME>"   # Name of your D1 database
database_id = "<YOUR_D1_DB_ID>"
migrations_dir = "drizzle/migrations" # not really needed now since we're going to upload the chinook dump directly
```

- Download the Chinook sample database from this [link](https://github.com/lerocha/chinook-database/blob/master/ChinookDatabase/DataSources/Chinook_Sqlite_AutoIncrementPKs.sql)

- Upload the sample database to the newly created D1 instance

```bash
pnpm wrangler d1 execute database_name < Chinook_Sqlite_AutoIncrementPKs.sql
```

## Usage

Running the Worker Locally

To test the API locally with Wrangler:

```bash
pnpm wrangler dev
```

### Testing Queries

Once the server is running, you can access the GraphQL playground at the local URL displayed by Wrangler, and start querying the database.

#### Example Queries

Here are some sample queries to get you started:

- List the first 20 artists, each with their first 10 albums, each album with its first 15 tracks, each track with its genre:

```graphql
query {
	artists(limit: 20) {
		artistId
		name
		albums(first: 10) {
			albumId
			title
			tracks(first: 15) {
				trackId
				name
				genre {
					name
				}
				bytes
				composer
			}
		}
	}
}
```

- Fetch customer with id=4 along with their support rep (an employee) and with their first 5 invoices

```graphql
{
	customer(id: 4) {
		customerId
		firstName
		lastName
		company
		email
		phone
		supportRep {
			employeeId
			firstName
			lastName
			email
			phone
		}
		invoices(first: 5) {
			invoiceId
			invoiceDate
			total
		}
	}
}
```

## Performance

All resolvers use conditional joins and/or dataloaders to hit the database the minimum time possible

- The 1st example query above hits the databses 3 times only while having 4 levels of nesting and eager loading of one-to-many relation (albums, and albums->tracks)
  - Without dataloders or joins this would hit the database up to 1 + 20 + 20 _ 10 + 20 _ 15 \* 10 = 3221 times
- The 2nd example hits the database 2 times with 2 levels of nesting while fetching a one to many relation (invoices)
  - Without dataloders or joins this would hit the database up to 1 + 1 + 5 = 7 times

## Deployment

To deploy the project to Cloudflare Workers:

```bash
pnpm wrangler deploy
```
