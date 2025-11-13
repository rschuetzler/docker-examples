# Web app containers, and Container management

Much of the time you work with Docker, it will be in a web development context.
It can make the job easier in a lot of ways, so let's see what that looks like.

Open up the Dockerfile in this folder to see what we're doing here.
First, you see that we're working with a NodeJS application. The first step is to set our working directory inside the image. All the rest of the commands will do work based on that directory.

Next, we copy in the `package.json` file, then run `npm install`. If you know NodeJS, you know that means we're installing the dependencies for an application. (Remember, this is all happening inside the image. Nothing is changing on your computer's hard drive).
Next we copy the contents of the current directory (the first `.` on line 9) into the image's working directory (the second `.` on line 9).

Then we `EXPOSE` a port - this is an important concept.
Within the Dockerfile, we have to tell the container to open up port 3000 (TCP by default) to the outside world, allowing traffic to pass in from outside the container.

Finally, we have `CMD ["npm", "start"]`. CMD tells our container what command to execute.

Build and run this image

```sh
docker build -t web-app:v1 .
docker run web-app:v1
```

This should start up the application, and you'll see a message in your terminal saying that the application is listening on http://localhost:3000.
Visit that page in your browser.
It didn't work!
Press CTRL+C 3 times in your terminal to stop the docker process from running. (NOTE: Stopping that docker process doesn't actually stop the container from running. We'll deal with that in a bit.)

Why didn't it work?
Because the `EXPOSE` command in the Dockerfile only tells the image to expose the port. To really use it, you have to also publish the port with the `docker run` command.

Run the following command:

```sh
docker run -p 3000:3000 web-app:v1
```

Now you can visit http://localhost:3000 and see the application in action. Running the command in this way creates a mapping between the external (to docker) port 3000 (the first 3000), and the internal, exposed port 3000 (the second 3000). It publishes the port to your operating system so that you can connect from applications besides Docker.
Remember: If you want to connect to applications running in Docker from outside Docker, you need to both `EXPOSE` and publish (`-p`) the ports.

## Cleaning up
Like I mentioned above, closing the docker terminal process with CTRL+C (3x) doesn't automatically stop any running containers.
The process that runs those containers is always going, so the containers keep going with it.
To see a list of containers that are running, you can type the following command:

```sh
docker ps
```

This list of currently running containers includes information like container id, an auto-generated name, when the container was created, and ports mapped by the containers.

To stop a container, we run the `docker stop` command with either the container's name or id. Since the name is easier to type, that's what I usually use. Just run this command, replacing `container_name` with the name of the container.

```sh
docker stop container_name
```

There's another secret you need to know about containers - just because they stop doesn't mean they go away. Your computer holds onto old containers just in case you want to run them again later. To see the full list of containers still available on your computer run:

```sh
docker ps -a
```

If you've been typing commands with this tutorial, you probably have a few python-basic containers and web-app containers laying around waiting for you to run them again. There's a few ways to clean up that list.

First, we can delete all stopped containers with:

```sh
docker container prune
```

You can remove specific stopped containers with

```sh
docker rm name_or_id
```

And you can do more complex things by chaining docker commands together as outlined in the [Docker documentation](https://docs.docker.com/reference/cli/docker/container/rm/#remove-all-stopped-containers)


