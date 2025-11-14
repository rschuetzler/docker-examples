# Persisting Database Data with Named Volumes

> [!NOTE]
> This tutorial builds on the previous tutorial about volumes and bind mounts. If you haven't completed that one, go back and do it first!

In the last tutorial, we used bind mounts to connect our code directory to a container for live development. That works great for code, but databases need something different. You don't want to edit database files directly on your computer, but you absolutely need that data to persist when containers stop and start.

That's where **named volumes** come in.

## What are named volumes?

Named volumes are Docker-managed storage areas that persist independently of containers. Unlike bind mounts where you point to a specific folder on your computer, named volumes are stored in a special location managed by Docker. You give them a name, and Docker takes care of the rest.

They're perfect for databases because:
- Data persists even when you delete the container
- You don't store database files in your project directory where they can be accidentally edited or deleted
- Docker manages the storage location and permissions
- They work consistently across different operating systems

## Running PostgreSQL in Docker

Let's run a PostgreSQL database in Docker and see how data persistence works.

First, start a basic Postgres container:

```sh
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres:16
```

This pulls the official PostgreSQL image from Docker Hub and runs it. The `-e` flag sets an environment variable (the database password), and `-p` publishes the port so we can connect to it from your computer.

> [!TIP]
> If you get an error that port 5432 is already in use, you probably have PostgreSQL installed and running on your computer. You can either:
> 1. Stop your local PostgreSQL service
> 2. Use a different external port: `-p 5433:5432` (this maps your computer's port 5433 to the container's port 5432)
>
> If you use a different port, remember to connect to that port (e.g., `localhost:5433`) in all the following steps.

## Connecting with pgAdmin

If you have pgAdmin installed, you can use it to connect to your Docker database.

1. Open pgAdmin
2. Right-click "Servers" and select "Register" → "Server"
3. In the "General" tab, give it a name like "Docker Postgres"
4. In the "Connection" tab, enter:
   - Host: `localhost` (or `127.0.0.1`)
   - Port: `5432` (or whatever port you used in the docker run command)
   - Username: `postgres`
   - Password: `mysecretpassword`
5. Click "Save"

You should now be connected! You can use pgAdmin's query tool to run SQL commands.

## Connecting with psql

If you prefer the command line or don't have pgAdmin, you can use `psql`.

If you have psql installed on your computer:

```sh
psql -h localhost -U postgres
```

If you don't have psql installed, you can run it inside the Docker container:

```sh
docker exec -it my-postgres psql -U postgres
```

Enter the password `mysecretpassword` when prompted.

## Testing data persistence

Let's create some data and see what happens when we stop and restart the container.

Using pgAdmin's query tool or psql, create a table and add some data:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com'),
    ('Charlie', 'charlie@example.com');

SELECT * FROM users;
```

You should see your three users. Beautiful!

Now let's stop the container:

```sh
docker stop my-postgres
```

And start it again:

```sh
docker start my-postgres
```

Connect again (via pgAdmin or psql) and query your data:

```sql
SELECT * FROM users;
```

The data is still there! That's because even though containers are immutable, Postgres stores its data in a specific location (`/var/lib/postgresql/data`), and Docker automatically creates an anonymous volume for it when you don't specify one.

## The problem with anonymous volumes

Here's where things get tricky. Let's remove the container and create a new one:

```sh
docker stop my-postgres
docker rm my-postgres
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 postgres:16
```

Connect to the database (via pgAdmin or psql) and check:

```sql
SELECT * FROM users;
```

You get an error! The table doesn't exist anymore!

What happened? When you removed the container, that anonymous volume got left behind (orphaned), and the new container created a fresh new anonymous volume. Your data still exists somewhere in Docker's storage, but you can't access it because you don't know the volume's randomly generated name.

This is where **named volumes** save the day.

## Using named volumes for true persistence

Let's do it right this time. Stop and remove the container:

```sh
docker stop my-postgres
docker rm my-postgres
```

Now create a new container with a named volume:

```sh
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres:16
```

The `-v pgdata:/var/lib/postgresql/data` flag creates a named volume called `pgdata` and mounts it to the Postgres data directory in the container.

Connect and create your data again:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);

INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com'),
    ('Charlie', 'charlie@example.com');

SELECT * FROM users;
```

Now let's really test it. Stop and **remove** the container:

```sh
docker stop my-postgres
docker rm my-postgres
```

The container is gone. But now create a brand new container with the same named volume:

```sh
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -v pgdata:/var/lib/postgresql/data postgres:16
```

Connect and check your data:

```sql
SELECT * FROM users;
```

Your data is still there! The named volume persists independently of the container. You can remove and recreate containers all day long, and as long as you mount the same named volume, your data persists.

This is incredibly powerful. You can:
- Upgrade the Postgres version by pulling a new image and creating a new container with the same volume
- Recover from a corrupted container by creating a new one
- Share the same data volume across multiple container instances (with appropriate database clustering)

## Managing volumes

You can see all your volumes with:

```sh
docker volume ls
```

You should see `pgdata` in the list, along with any anonymous volumes left behind from earlier experiments.

To see detailed information about a volume:

```sh
docker volume inspect pgdata
```

To remove a specific volume:

```sh
docker volume rm pgdata
```

> [!NOTE]
> You can't remove a volume while a container is using it. Stop and remove the container first.

To remove all unused volumes (including those orphaned anonymous volumes):

```sh
docker volume prune
```

Be careful with `prune` - it will delete any volumes not currently attached to a container, which could include data you want to keep!

## Why immutability still matters

Even with named volumes, remember that the container and image are still immutable:

- The database software (PostgreSQL itself) doesn't change unless you pull a new image and create a new container
- The database configuration baked into the image doesn't change
- Only the data in your named volume can change

This is actually a powerful combination:
- Your database software version is predictable and version-controlled (immutable images)
- Your data persists and grows over time (named volumes)
- You can upgrade PostgreSQL by pulling a new image and creating a new container, while keeping the same data volume

The immutable container runs the database software, while the named volume stores the mutable data. Each does what it does best, and together they give you a robust, maintainable database setup.

## When to use named volumes vs bind mounts

Now that you've seen both, here's when to use each:

**Named volumes** - Use for:
- Database data
- Application-generated files you need to persist
- Any data that needs to persist but you don't need to edit directly

**Bind mounts** - Use for:
- Source code during development
- Configuration files you edit frequently
- Any files where you need direct access from your computer

The rule of thumb: If you're editing it, use a bind mount. If you're just storing it, use a named volume.
