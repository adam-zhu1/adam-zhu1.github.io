/**
 * TrueLine's page: why it exists, how it works stage by stage, what was hard, where it
 * stands. Every figure here was checked against the app's repo on 19 Nov 2026 (its notes
 * and experiment write-ups). The page describes version 1.1.
 */
export type Change = { label: string; from: string; to: string };

export const TRUELINE = {
  strip: [
    ["Role", "Solo project"],
    ["Built with", "Swift, Vision, Core ML"],
    ["Status", "On the App Store since August 2026"],
    ["Runs", "On the phone. No video is uploaded."],
  ] as [string, string][],

  links: [
    { href: "https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797", label: "App Store" },
    { href: "https://truelinebowling.com/", label: "truelinebowling.com" },
    { href: "https://truelinebowling.com/press/", label: "Press kit" },
  ],

  whyShort: "I bowled on my high school team, and when a shot missed I never knew whether I had missed my target, changed speed, or the lane had changed. The systems that measure this cost over $10,000. TrueLine reads the same kind of numbers from one iPhone propped behind the approach.",

  why: [
    "I bowled on my high school team. The frustrating part of a missed shot was not knowing why it missed. I could not tell whether I had missed my target, thrown it slower, or the oil on the lane had changed. Bowling has a rule, don’t move off a bad shot, but to follow it you have to know whether the shot was bad or the lane was.",
    "The systems that measure this are built into the lane. Kegel listed its portable one, Specto Go, at $14,995 when it launched, and most centers don’t have one. TrueLine reads the same kind of numbers from one iPhone propped behind the approach: launch speed, the board the ball crossed at the arrows, where it broke, and the board and angle it entered the pins on. If you hit your target at your normal speed and still missed, the lane changed, and it is time to move.",
  ],

  /* one per stage of the demo */
  how: [
    { name: "Film", short: "Prop one iPhone behind the approach and bowl. Everything after this runs on the phone.", body: "Prop the phone behind the approach and bowl. The app records at 60 frames a second where the camera supports it. Everything after this happens on the phone, so it works in an alley with no signal.", fact: ["1 phone", "no sensors, no account"] },
    { name: "Find the ball", short: "A YOLOv8n detector I fine-tuned on 215 labeled frames finds the ball in each frame.", body: "A YOLOv8n detector, fine-tuned on 215 labeled frames from about 12 videos, finds the ball in each frame. Converted to Core ML it is 5.9 MB, and its box lands within 1.0 to 1.4 pixels of the ball’s labeled centre.", fact: ["5.9 MB", "the whole model, on the phone"] },
    { name: "Follow it", short: "A Kalman filter joins the detections into one path and coasts through the frames where the ball is hidden.", body: "A Kalman filter joins the detections into one path. It locks onto the ball, rejects detections that jump, and coasts through the frames where the bowler’s body hides it.", fact: ["70 frames", "tracked on this throw"] },
    { name: "Map the lane", short: "Six taps on lane markings and a least-squares fit turn every pixel into a board and a distance.", body: "The camera sees the lane as a tilted trapezoid. Six taps on markings that are easy to hit (the foul-line corners, three arrows, the head pin) and a least-squares fit turn every pixel into a board and a distance in feet.", fact: ["6 taps", "to calibrate a lane"] },
    { name: "Read the numbers", short: "Speed, boards and angles are fitted to the raw detections and come back seconds after the throw.", body: "Speed, angles and boards are fitted to the raw detections: launch speed, the board at the arrows, the breakpoint, the hook, and the board and angle the ball entered on. Each throw comes back seconds after it hits the pins.", fact: ["16.3", "entry board on this throw, just right of the pocket"] },
  ],

  hard: [
    { name: "A bug that moved every number sideways",
      sum: "Version 1.0 worked out the ball’s position in the wrong camera orientation, so every number read about 7 boards to one side. I fixed it in 1.1 and added tests for it.",
      body: "In version 1.0 the point where the ball touches the lane was worked out in the camera’s raw sensor orientation, not in the rotated video frame. On portrait clips every sample shifted sideways by one ball radius, which is about 7 boards by the time the ball reaches the pins. A pocket strike read as a hit on the wrong side of the head pin. I fixed it in 1.1, added tests for it, and checked the result on reference clips. 1.1 also marks the throws that the old version saved.",
      changes: [
        { label: "Error at the pin deck", from: "about 7 boards", to: "fixed" },
        { label: "Strike clip, entry board against the reference", from: "", to: "17.9 vs 17.56" },
        { label: "Miss clip, entry board against the reference", from: "", to: "11.8 vs 11.7" },
      ] as Change[] },
    { name: "Accurate numbers, not only plausible ones",
      sum: "I built a benchmark from 223 labeled ball positions, found the error was in the smoothing and not the detector, and cut it about fivefold.",
      body: "I labeled 223 ball positions across 7 clips, checked each by eye, and built a benchmark that runs the app’s own analysis code against them. The detector turned out to be within about a pixel. The error came later: the metrics were read off a smoothing filter that lagged the ball by 3 to 11 pixels. Fitting the raw detections instead cut it. The same throw filmed at 30 and at 60 frames a second used to read 16.0 and 13.6 mph. It now reads 17.6 and 17.7.",
      changes: [
        { label: "Entry board", from: "2.13 boards off", to: "0.43" },
        { label: "Entry angle", from: "2.09° off", to: "0.21°" },
        { label: "Launch speed", from: "2.16 mph off", to: "0.18" },
      ] as Change[] },
    { name: "Calibrating the lane",
      sum: "Automatic detection kept finding the wrong lane and four dragged corners were fragile, so I simulated tapping mistakes and rebuilt the step around six lane markings.",
      body: "Automatic lane detection found nothing on most clips and was 270 to 450 pixels off on the rest, because every lane looks like the one beside it. Dragging four corners, as 1.0 does, is fragile: the far end of the lane is a few pixels wide, and the shiny gutter edge a careful person picks is 66 pixels from where the wood really ends. I simulated tapping mistakes on 8 real calibrations, 2,000 trials for each setup, and rebuilt the step around six painted markings, followed by a final nudge that lines drawn pins up with the real ones.",
      changes: [
        { label: "Median entry error in simulation, four corners to six taps and the nudge", from: "2.95 boards", to: "0.52 to 0.72" },
      ] as Change[] },
  ],

  stands: [
    ["6 of 6", "unseen clips tracked down the full lane, across two bowling centers and three camera positions"],
    ["107", "unit tests in the app"],
    ["1 board", "or less between the Swift app and the Python prototype it was ported from, on 5 clips"],
    ["285 MB", "peak memory on a 25 second clip, down from 740"],
  ] as [string, string][],

  next: [
    ["Measured truth", "A session at the alley with tape on the lane and the speed display, to check the numbers against something physical. So far they are checked against labeled video."],
    ["More centers", "Most of my footage comes from one center. Other lighting and lane surfaces are next."],
    ["Rev rate", "It works as a Python experiment. It is not in the app yet."],
  ] as [string, string][],

  made: "I built the whole pipeline in Python first, starting in March 2026, then ported it to Swift in July and shipped 1.0 in August.",
};
