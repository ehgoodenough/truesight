import * as Preact from "preact"
import Poin from "poin"
import ShortId from "shortid"
// import QueryString from "query-string"
import FormatDuration from "format-duration"

import parseYoutubeId from "../functions/parseYoutubeId.js"
import computeCurrentTime from "../functions/computeCurrentTime.js"

export default class MusicSelection {
    render() {
        return (
            <div class="MusicSelection">
                <SubmissionForm/>
                <Controls/>
            </div>
        )
    }
}

class SubmissionForm {
    render() {
        return (
            <form class="SubmissionForm" onSubmit={this.onSubmit}>
                <input name="youtube" type="text" placeholder="put your youtube url here"/>
                <input type="submit"/>
            </form>
        )
    }
    onSubmit(event) {
        event.preventDefault()
        const submittedValue = event.target.children["youtube"].value
        const youtubeId = parseYoutubeId(submittedValue)
        if(youtubeId == undefined || youtubeId == "") return

        let startTime = Date.now()

        let submittedTime = (submittedValue.match(/t=([^&]*)/) || [])[1]
        if(submittedTime != undefined) {
            submittedTime = parseInt(submittedTime)
            submittedTime *= 1000
            startTime -= submittedTime
        }

        window.firebase.data.collection("campaigns").doc("theros").update({
            "music": {
                "key": ShortId.generate(),
                "youtubeId": youtubeId,
                "startTime": startTime,
                "state": "playing",
            }
        })
    }
}

class Controls {
    render() {
        return (
            <div class="Controls">
                <Timeline/>
                <div class="Panel">
                    <div class="PreviousButton"></div>
                    <div class="PlayButton" onClick={this.onClickPlayButton}>
                        <span class="material-icons">{window.app.campaign.music.state == "paused" ? "play_arrow" : "pause"}</span>
                    </div>
                    <div class="NextButton"></div>
                    <div class="VolumeButton"></div>
                    <div class="Time">{this.getCurrentTimeText()} / {this.getTotalTimeText()}</div>
                </div>
            </div>
        )
    }
    onClickPlayButton() {
        if(window.app.campaign.music.state != "paused") {
            window.firebase.data.collection("campaigns").doc("theros").update({
                "music": {
                    "key": window.app.campaign.music.key,
                    "youtubeId": window.app.campaign.music.youtubeId,
                    "currentTime": Date.now() - window.app.campaign.music.startTime,
                    "state": "paused"
                }
            })
        } else if(window.app.campaign.music.state == "paused") {
            window.firebase.data.collection("campaigns").doc("theros").update({
                "music": {
                    "key": window.app.campaign.music.key,
                    "youtubeId": window.app.campaign.music.youtubeId,
                    "startTime": Date.now() - window.app.campaign.music.currentTime,
                    "state": "playing"
                }
            })
        }
    }
    getCurrentTimeText() {
        let time = this.getCurrentTime()
        time = Math.min(time, this.getTotalTime())
        if(isNaN(time)) time = 0
        return FormatDuration(time)
    }
    getTotalTimeText() {
        let time = this.getTotalTime()
        if(isNaN(time)) time = 0
        return FormatDuration(time)
    }
    getCurrentTime() {
        if(window.app?.campaign?.music == undefined) return 0
        return computeCurrentTime(window.app.campaign.music)
    }
    getTotalTime() {
        if(window.youtubePlayer?.getDuration == undefined) return 0
        return window.youtubePlayer.getDuration() * 1000
    }
}

class Timeline {
    render() {
        return (
            <div class="Timeline" id="timeline" onClick={this.onClick}>
                <div class="CurrentTime" style={this.getCurrentTimeStyle()}>
                    <div class="Dot"/>
                </div>
                <div class="HoveredTime" style={this.getHoveredTimeStyle()}>
                    <div class="Timestamp">
                        <span>{this.getHoveredTimeText()}</span>
                    </div>
                </div>
                <div class="TotalTime"/>
            </div>
        )
    }
    get onClick() {
        return (event) => {
            let time = this.getHoveredTime()
            window.firebase.data.collection("campaigns").doc("theros").update({
                "music": {
                    "key": window.app.campaign.music.key,
                    "youtubeId": window.app.campaign.music.youtubeId,
                    "startTime": Date.now() - time,
                    "state": "playing",
                }
            })
        }
    }
    getHoveredTimeText() {
        let time = this.getHoveredTime()
        if(isNaN(time)) time = 0
        return FormatDuration(time)
    }
    getCurrentTimeStyle() {
        return {
            "width": (this.getCurrentTime() / this.getTotalTime()) * 100 + "%"
        }
    }
    getHoveredTimeStyle() {
        return {
            "width": (this.getHoveredRelativePosition() * 100) + "%"
        }
    }
    getCurrentTime() {
        return computeCurrentTime(window.app.campaign.music)
    }
    getTotalTime() {
        if(window.youtubePlayer?.getDuration == undefined) return 0
        return window.youtubePlayer.getDuration() * 1000
    }
    getHoveredRelativePosition() {
        if(document.getElementById("timeline") == undefined) return 0
        const bounds = document.getElementById("timeline").getBoundingClientRect()
        return (Poin.position.x - bounds.x) / bounds.width
    }
    getHoveredTime() {
        return this.getHoveredRelativePosition() * this.getTotalTime()
    }
}
