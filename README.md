# Overview
Audio-to-Text is a Google Cloud Function that accepts an audio file and sends it to the Google Cloud Speech API for translation. The Cloud function is triggered by posting a file to an HTTP endpoint.

## Example Usage

We've used this on a React Native app built with Expo. Expo records an audio file, which is sent to the Google Function.

## Components
The pipeline is built on two components:
1. Google Cloud Functions
2. Google Cloud Speech API

You will need to sign up for Google Cloud services (including billing), create a project and enable the Speech API. To deploy the function from local, you will need to install the Google Cloud SDK. More on that [here](https://cloud.google.com/nodejs/getting-started/hello-world).

## Audio Config
One of the tricky parts about this is to match the config to the file you are trying to translate. On iOS I have had the best luck with `.wav` files at 41000 Hz.

This Cloud Function includes a hardcoded config:
- Format: LINEAR16
- Frequency: 41000 Hz (16000 or higher is recommended)
- Channels: Mono (a Cloud Speech API requirement)
- Language: English (US)

Included in this repo is a test audio file that will work if you change the hZ to 24000.

I also used [ffmpeg](https://www.ffmpeg.org/) to get the encoding, hZ, etc for an audio file:

```
brew install ffmpeg
ffmpeg -i ~/Documents/speech-test.wav -hide_banner
```

## Deployment

To create the function and deploy it:
```
gcloud functions deploy audioToText --trigger-http --runtime nodejs8
```
After it's created:

```
gcloud functions deploy audioToText
```

## References
* https://cloud.google.com/functions/docs/writing/http - Multipart Data
* Helpful example of audio to text pipeline: https://github.com/jlaham/audio-2-text