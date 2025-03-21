# TaskForceAI

#### This works together with Model trained at the following repository:
```
https://github.com/artonh/TaskForceAIWebApplication
```

After cloning and running replace the resource paths in the `appsettings.json` with the ones present in this repo
```
{
...
  "FilePaths": {
    "TasksJson": "ABSOLUTE_PATH_OF_YOUR_REPO\\taskforce-ai\\data\\tasks.json",
    "UsersJson": "ABSOLUTE_PATH_OF_YOUR_REPO\\data\\user_availability.json"
  },
...
}

```

```
npm install
```

```
Download ffmpeg for Whisper API to be functional.
Place it inside bin folder.
https://ffmpeg.org/download.html#build-windows
```

```
Replace OpenAI KEY and assistant ID in env file.
```
