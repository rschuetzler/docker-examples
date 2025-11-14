# Getting Docker ready

You can download Docker from https://docs.docker.com/get-started/get-docker/.
Once you've downloaded and installed it, let's take it for a test run.

## Testing Docker

The first test to see if Docker is installed and running correctly is to open a terminal and run the following command.

```bash
docker run hello-world
```

You'll see some messages from Docker about pulling from library, downloading the image, and then you'll get a message saying "Hello from Docker!" and a bunch of other stuff that tells you what just happened. We'll learn more about that in future exercises. For now, it's just good to know that it's running.

The next thing we're going to do is create a new container with the Ubuntu image, then open a terminal on that container just to see what happens. Run the following command:

```bash
docker run -it ubuntu bash
```

This command pulls the ubuntu container image, creates a container with that image, and then runs an interactive terminal with bash. You can see that your terminal prompt changed to something like `root@92a8b88c8879`. Typing commands in that terminal is running those commands inside the docker container.

Try typing the following command to see some system information:

```bash
cat /etc/os-release
```

You'll see a bunch of information about the Ubuntu Linux container you're talking to. To quit the terminal, type `exit` and hit Enter.

## What's coming
Now you've got Docker running, and have seen it in action. In the next tutorial, we'll see how to create a container image, and what those can do.
