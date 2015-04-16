# color-4
Try it: http://color4.blacktowerentertainment.com/

A simple example of a multiplayer server done with WS deployable with docker

The game is a simple, connect four blocks of the same color

Try and be #1 in the leaderboard.

## run server on port 80
`node index`
## run server on port 8080
`export port=8080 node index`
## Docker build
`docker build -t <yourname>:color-server .`
## Docker run (SDC-Triton) /w Public IP
`docker pull dinesalexander/color-server`
`docker run -dP dinesalexander/color-server`

## Docker Hub
https://registry.hub.docker.com/u/dinesalexander/color-server/
