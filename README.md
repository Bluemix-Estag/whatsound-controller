# WhatSound Controller


Endpoint to control api requests like Spotify track,album and artist search,
Youtube music video search and Vagalume Lyrics search



REST API example for Spotify:

```
    GET https://whatsound-controller.mybluemix.net/action?action=spotify&query=in the end"
```



# Response:

```
 {
  "name": "In The End",
  "artist": "Linkin Park",
  "album": "Hybrid Theory (Bonus Track Version)",
  "uri": "spotify:track:60a0Rd6pjrkxjPbaKzXjfq",
  "url": "https://open.spotify.com/track/60a0Rd6pjrkxjPbaKzXjfq",
  "typeGoogle": "track"
}

```

REST API example for Youtube:

```
    GET https://whatsound-controller.mybluemix.net/action?action=youtube&query=in the end"
```



# Response:

```
 [
  {
    "id": "eVTXPUF4Oz4",
    "iframe_url": "https://www.youtube.com/embed/eVTXPUF4Oz4",
    "thumbnail": "https://i.ytimg.com/vi/eVTXPUF4Oz4/default.jpg",
    "url": "https://www.youtube.com/watch?v=eVTXPUF4Oz4",
    "title": "In The End (Official Video) - Linkin Park"
  },
  {
    "id": "g9j5UzxEhEM",
    "iframe_url": "https://www.youtube.com/embed/g9j5UzxEhEM",
    "thumbnail": "https://i.ytimg.com/vi/g9j5UzxEhEM/default.jpg",
    "url": "https://www.youtube.com/watch?v=g9j5UzxEhEM",
    "title": "In The End (Official Lyric Video) - Linkin Park"
  }
]

```


REST API example for Lyrics:

```
    GET https://whatsound-controller.mybluemix.net/action?action=lyrics&query=in the end"
```



# Response:

```
 {
  "lyrics": {
    "track": "It starts with<br>One thing, I don't know why<br>It doesn't even matter how hard you try<br>Keep that in mind<br>I designed this rhyme to explain in due time<br>All I know<br>Time is a valuable thing<br>Watch it fly by as the pendulum swings<br>Watch it count down to the end of the day<br>The clock ticks life away<br>It's so unreal<br>Didn't look out below<br>Watch the time go right out the window<br>Trying to hold on, but didn't even know<br>I wasted it all<br>
    .
    .
    .
    ,"translation": "[No fim] <br><br>Começa com<br>Uma coisa, eu não sei por quê<br>Nem importa o quanto você tenta,<br>Tenha isso em mente<br>Eu fiz essa rima para explicar em seu devido tempo<br>Tudo que eu sei<br>Tempo é uma  tudo<br>Mas no fim isso não tem mais importância."
    .
    .
    .
  },
  "message": "",
  "status": true
}
 
 
```

