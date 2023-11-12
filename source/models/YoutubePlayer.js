import Data from "models/Data.js"
import Something from "models/Something.js"
import computeCurrentTime from "views/functions/computeCurrentTime.js"

const SILENCE_VIDEO_ID = "g4mHPeMGTJM"
const DEFAULT_VOLUME = 50

export default class YoutubePlayer {
    async instantiate() {
        await YoutubeIframeApiReady()
        return new Promise((resolve, reject) => {
            this.player = new YT.Player("youtuber", {
                "width": "300",
                "height": "200",
                "videoId": SILENCE_VIDEO_ID,
                "playerVars": {
                    "fs": 0,
                    "rel": 0,
                    "controls": 1,
                    "disablekb": 1,
                    "modestbranding": 1,
                    // "start": (computeCurrentTime(Data.campaign.streams["a"].run) / 1000) || 1,
                    "start": 0,
                    "autoplay": true,
                },
                "events": {
                    "onReady": (event) => {
                        this.player.seekTo((computeCurrentTime(Data.campaign.streams["a"].run) / 1000) || 1)
                        if(Data.campaign.streams["a"].run.youtubeId != undefined) {
                            if(Data.campaign.streams["a"]?.run?.state == "paused") {
                                this.player.pauseVideo()
                            } else if(Data.campaign.streams["a"]?.run?.state != "paused") {
                                this.player.playVideo()
                            }
                        }

                        const volume = parseInt(window.localStorage.getItem("audio-volume")) || DEFAULT_VOLUME
                        this.player.setVolume(volume)
                        resolve()
                    },
                    "onStateChange": (event) => {
                        if(event.data == YT.PlayerState.PAUSED
                        && Data.campaign.streams["a"]?.run?.state != "paused") {
                            this.player.seekTo((computeCurrentTime(Data.campaign.streams["a"].run) / 1000) || 1)
                            event.target.playVideo()
                            return
                        }
                        if(event.data == YT.PlayerState.PLAYING
                        && Data.campaign.streams["a"]?.run?.state != "playing") {
                            this.player.seekTo((computeCurrentTime(Data.campaign.streams["a"].run) / 1000) || 1)
                            event.target.pauseVideo()
                            return
                        }

                        if(event.data == YT.PlayerState.ENDED) {
                            if(Data.campaign.streams["a"].queue == undefined) return
                            if(Data.campaign.streams["a"].queue.length == 0) return
                            const currentMusic = Data.campaign.streams["a"].queue.find((music) => {
                                return Data.campaign.streams["a"].run.queueId == music.queueId
                            })
                            const currentIndex = Data.campaign.streams["a"].queue.indexOf(currentMusic)
                            const nextIndex = currentIndex + 1
                            const nextMusic = Data.campaign.streams["a"].queue[nextIndex]
                            if(nextMusic == undefined) return
                            const TIME_BETWEEN_SONGS = 500
                            Something.updateCurrentRun("a", {
                                "queueId": nextMusic.queueId,
                                "youtubeId": nextMusic.youtubeId,
                                "startTime": Date.now() + TIME_BETWEEN_SONGS - (nextMusic.embeddedStartTime || 0),
                                "state": "playing",
                            })
                        }
                    },
                    "onError": (event) => {
                        reject(event)
                        console.log("onError", event)
                    }
                }
            })
        })
    }
    // youtubeId is just the id not the full url.
    // currentTime is milliseconds.
    async load({youtubeId, currentTime}) {
        if(this.player == undefined) await this.instantiate()
        this.player.loadVideoById({
            "videoId": youtubeId,
            "startSeconds": Math.floor(currentTime / 1000) || 1,
        })
    }
    async seek({currentTime}) {
        if(this.player == undefined) await this.instantiate()
        this.player.seekTo(Math.floor(currentTime / 1000) || 1)
    }
    async pause() {
        if(this.player == undefined) await this.instantiate()
        this.player.pauseVideo()
    }
    async play() {
        if(this.player == undefined) await this.instantiate()
        this.player.playVideo()
    }
}

async function YoutubeIframeApiReady() {
    return new Promise((callback) => {
        if(window.isYouTubeIframeAPIReady == true) {
            return callback()
        } else {
            YoutubeIframeApiReady.callbacks = YoutubeIframeApiReady.callbacks || []
            YoutubeIframeApiReady.callbacks.push(callback)
        }
    })
}

window.isYouTubeIframeAPIReady = false
window.onYouTubeIframeAPIReady = function() {
    window.isYouTubeIframeAPIReady = true
    if(YoutubeIframeApiReady.callbacks instanceof Array) {
        YoutubeIframeApiReady.callbacks.forEach((callback) => callback())
    }
}
