import * as Preact from "preact"
import Navigation from "models/Navigation.js"

const random = Math.ceil(Math.random() * 3)

export default class PlayScreen {
    render() {
        return (
            <div class="SplashScreen" onClick={this.onClick}>
                <div class="Background" random={random}/>
                <div class="Prompt">
                    <div class="Icon">
                        <div class="fill"/>
                        <div class="shape material-icons">smart_display</div>
                    </div>
                </div>
            </div>
        )
    }
    onClick() {
        // Navigation.go("/play")
        Navigation.run("/play")
    }
}
