import {
  Component,
  Input,
  Output,
  AfterViewInit,
  ViewChild,
  NgZone,
  EventEmitter
} from "@angular/core"
import { DomSanitizer} from '@angular/platform-browser'

@Component({
  selector: "audio-element",
  styleUrls: ["./audio-element.scss"],
  templateUrl: "./audio-element.html"
})
export class MediaElement implements AfterViewInit {
  @ViewChild("audioElement")
  audioElement
  @ViewChild("progressPlayed")
  progressPlayed
  @ViewChild("progressLine")
  progressLine
  @ViewChild("volumeFader")
  volumeFader
  @ViewChild("volumeLine")
  volumeLine
  @Input()
  src: string
  @Input()
  volume: number
  @Output()
  volumechange = new EventEmitter<string>()

  private isMuted:boolean = false
  private isPlaying: boolean = false
  private totalDuration: number = null
  private currentTime: number = 0
  private isMovingPlayback: boolean = false

  constructor(
    protected ngZone: NgZone,
    protected domSanitizer:DomSanitizer
    ) {}

  get currentTimePercent() {
    return 100 * (this.currentTime / this.totalDuration)
  }

  get currentTimeFormatted(){
    return this.formatTime(this.currentTime)
  }
  
  get totalDurationFormatted(){
    return this.formatTime(this.totalDuration)
  }

  get downloadUrl (){
    return  (<any>this.domSanitizer.bypassSecurityTrustUrl(this.src)).changingThisBreaksApplicationSecurity
  }
  
  formatTime(seconds:number){
    let date = new Date(null);
    date.setSeconds(seconds); 
    return date.toISOString().substr(14,5);
  }

  ngAfterViewInit() {
    const audio = this.audioElement.nativeElement
    audio.volume = this.volume || 1
    // Set duration of audio
    audio.addEventListener(
      "canplaythrough",
      () => {
        this.totalDuration = audio.duration
      },
      false
    )
    // Set update of current time
    audio.addEventListener("timeupdate", () => {
      if(!this.isMovingPlayback){
        this.currentTime = audio.currentTime
      }
    })
    // Set initial state on end play
    audio.addEventListener("ended",() => {
      this.isPlaying = false;
      audio.currentTime = 0
    })
    // Setup progress line
    this.ngZone.runOutsideAngular(() => {
      this.setupProgressLine()
      this.setupVolumeFader()
    })
  }

  private setupProgressLine(){
    const progressPlayed = this.progressPlayed.nativeElement
    const progressLine = this.progressLine.nativeElement
    let newWidthPercent;

    let startEvent = (e) => {

      const pageXOffset = (<any>window).pageXOffset      
      const progressLineX = pageXOffset + progressLine.getBoundingClientRect().left
      this.isMovingPlayback = true;
      
      let moveEvent = (e) => {
        const x = e.pageX || e.touches[0].pageX
        let newWidth = x - progressLineX

        if (newWidth < 0) {
          newWidth = 0
        }

        if (newWidth > progressLine.offsetWidth) {
          newWidth = progressLine.offsetWidth
        }
        
        newWidthPercent = 100 / progressLine.offsetWidth * newWidth 
        progressPlayed.style.width = `${newWidthPercent}%`
      }

      let endEvent = () => {
        document.removeEventListener("mousemove", moveEvent,false)
        document.removeEventListener("touchmove", moveEvent, false)
        document.removeEventListener("mouseup", endEvent,false) 
        document.removeEventListener("touchend", endEvent, false) 

        this.audioElement.nativeElement.currentTime = this.totalDuration / 100 * newWidthPercent
        this.isMovingPlayback = false;
      }
      moveEvent(e);
      document.addEventListener("mousemove", moveEvent)
      document.addEventListener("touchmove", moveEvent)
      document.addEventListener('mouseup', endEvent, false)
      document.addEventListener("touchend",endEvent,false)
    }
    progressLine.addEventListener("mousedown", startEvent )
    progressLine.addEventListener("touchstart", startEvent )
  }

  private setupVolumeFader(){
    const volumeFader = this.volumeFader.nativeElement
    const volumeLine = this.volumeLine.nativeElement
    volumeFader.style.left = this.audioElement.nativeElement.volume * 100 + '%'
    let startEvent = (e) => {
      let newLeftPercent;

      const pageXOffset = (<any>window).pageXOffset     
      const volumeLineX = pageXOffset + volumeLine.getBoundingClientRect().left

      let moveEvent = (e) => {
        const x = e.pageX || e.touches[0].pageX
        let newLeft = x - volumeLineX

        if (newLeft < 0) {
          newLeft = 0
        }

        let rightEdge = volumeLine.offsetWidth - volumeFader.offsetWidth

        if (newLeft > rightEdge) {
          newLeft = rightEdge
        }
        
        newLeftPercent = 100 / volumeLine.offsetWidth * newLeft 

        volumeFader.style.left = `${newLeftPercent}%`
        this.audioElement.nativeElement.volume = newLeftPercent / 100
      }
      let endEvent = () => {
        document.removeEventListener("mousemove", moveEvent,false)
        document.removeEventListener("touchmove", moveEvent, false)
        document.removeEventListener("mouseup", endEvent,false) 
        document.removeEventListener("touchend", endEvent, false) 
      }
      moveEvent(e)
      document.addEventListener("mousemove", moveEvent)
      document.addEventListener("touchmove", moveEvent)
      document.addEventListener('mouseup', endEvent, false)
      document.addEventListener("touchend",endEvent,false)
    }
    volumeLine.addEventListener("mousedown", startEvent )
    volumeLine.addEventListener("touchstart", startEvent )
  }

  private togglePlay() {
    this.audioElement.nativeElement[this.isPlaying ? 'pause' : 'play']()
    this.isPlaying = !this.isPlaying
  }

  private toggleMuted(){
    this.audioElement.nativeElement.muted = this.isMuted = !this.isMuted
  }
}
