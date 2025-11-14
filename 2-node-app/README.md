# Web app containers

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
Press CTRL+C 3 times in your terminal to stop the docker process from running.

> [!NOTE]
> Stopping that docker process doesn't actually stop the container from running. We'll deal with that in a bit.

Why didn't it work?
Because the `EXPOSE` command in the Dockerfile only tells the image to expose the port. To really use it, you have to also publish the port with the `docker run` command.

Run the following command:

```sh
docker run -p 3000:3000 web-app:v1
```

Now you can visit http://localhost:3000 and see the application in action. Running the command in this way creates a mapping between the external (to docker) port 3000 (the first 3000), and the internal, exposed port 3000 (the second 3000). It publishes the port to your operating system so that you can connect from applications besides Docker.
Remember: If you want to connect to applications running in Docker from outside Docker, you need to both `EXPOSE` and publish (`-p`) the ports.
