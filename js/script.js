// noinspection JSJQueryEfficiency

north=$("#north")
east=north.clone()
south=north.clone()
west=north.clone()
east.attr("id","east")
south.attr("id","south")
west.attr("id","west")
east.insertAfter(north)
south.insertAfter(east)
west.insertAfter(south)
north.addClass("north")
west.addClass("west")
east.addClass("east")
south.addClass("south")
$("#north .whist1").addClass("west")
$("#north .whist2").addClass("south")
$("#north .whist3").addClass("east")
$("#east .whist1").addClass("north")
$("#east .whist2").addClass("west")
$("#east .whist3").addClass("south")
$("#south .whist1").addClass("east")
$("#south .whist2").addClass("north")
$("#south .whist3").addClass("west")
$("#west .whist1").addClass("south")
$("#west .whist2").addClass("east")
$("#west .whist3").addClass("north")

document.querySelectorAll(".quadruplicate").forEach(i=>{
        let n = $(i)
        let e = n.clone().insertAfter(n)
        let s = e.clone().insertAfter(e)
        let w = s.clone().insertAfter(s)
        n.addClass("north")
        w.addClass("west")
        e.addClass("east")
        s.addClass("south")
})
let defaultGame =   {
    "north":"Север",
    "east":"Восток",
    "south":"Юг",
    "west":"Запад",
    "target":10,
    "players":3,
    "rounds" : []
}
let game = JSON.parse(localStorage.getItem("game"))
if (game === null)
    game = defaultGame
var sides = ["north","south","east","west"]
function findClass(e,from) {
    for (const i of from)
        if (e.hasClass(i))
            return i
    return side(e.parent())
}
function side(e) {
    return findClass(e,sides)
}
let whistOptions = ["whist","half-whist","pass"]
function whistOption(e) {
    return findClass(e,whistOptions)
}

function add(what,where) {
    $(where).append("<span class='entry'>"+what+"</span> ")
}

let pool
let mountain
let whists
function addWhist(value,who,on) {
    if (value===0) return
    whists[who][on]+=value;
    add(whists[who][on],`.${who} .${on} p`)
}
function addPool(value,who) {
    if (value===0) return
    pool[who]+=value;
    add(pool[who],`.${who} .pool p`)
}
function addMountain(value,who) {
    if (value===0) return
    mountain[who]+=value;
    add(mountain[who],`.${who} .mountain p`)
}
function determinePlayers(resting) {
    return sides.filter(i=>i!==resting)
}

let addSign = i=>`${i>=0?"+":""}${i}`

function update() {
    localStorage.setItem("game",JSON.stringify(game))
    sides.forEach(s=>$(`#${s} .name-input`).val(game[s]))
    pool = {}
    mountain = {}
    whists = {}
    score = {}
    $("#field p").text("")
    sides.forEach(s=>{
        pool[s]=0;
        mountain[s]=0;
        score[s] = 0;
        whists[s]={};
        sides.forEach(s2=> {
            if(s2!==s)
                whists[s][s2]=0;
        });
    })
    if(game.players===3) {
        $(".north p").text("☓")
        $("#change-players").text("looks_4")
        $("#cover").show()
    }
    if(game.players===4) {
        $("#change-players").text("looks_3")
        $("#cover").hide()
    }
    $("#target-input").val(game.target)
    game.rounds.forEach(i=>{
        let prevScore = {}
        sides.forEach(s=>prevScore[s]=score[s])
        if (i.type==="whist")
            addWhist(i.value,i.who,i.on)
        if (i.type==="pool")
            addPool(i.value,i.who)
        if (i.type==="mountain")
            addMountain(i.value,i.who)
        if (i.type==="raspasi") {
            let players = determinePlayers(i.rests)
            let best = 10
            players.forEach(s=>best=Math.min(best,i.tricks[s]))
            players.forEach(s=>addMountain(i.tricks[s]-best,s))
        }
        if (i.type==="misere") {
            if (i.tricks[i.who]===0)
                addPool(10,i.who)
            else
                addMountain(10*i.tricks[i.who],i.who)
        }
        if (i.type==="for-tricks") {
            let defenders = determinePlayers(i.rests).filter(s=>s!==i.who)
            let trickValue = (i.target-5)*2
            if (i.whist[defenders[0]]==="whist" || i.whist[defenders[1]]==="whist") { //round was played
                if (i.whist[defenders[0]]==="whist" && i.whist[defenders[1]]==="whist") {
                    let defenderObligation = i.target>=7?1:2;
                    defenders.forEach(s=>addWhist(trickValue*i.tricks[s],s,i.who))
                    defenders.forEach(s=> {
                        if (i.tricks[s]<defenderObligation)
                            addMountain((defenderObligation-i.tricks[s])*trickValue,s)
                    })
                } else {
                    let defender = i.whist[defenders[0]]==="whist"?defenders[0]:defenders[1];
                    let defenderObligation = i.target>=8?1:(i.target===6?4:2);
                    let tricks = i.tricks[defenders[0]]+i.tricks[defenders[1]]
                    addWhist(tricks*trickValue,defender,i.who)
                    if (tricks<defenderObligation)
                        addMountain((defenderObligation-tricks)*trickValue,defender)
                }
                if (i.tricks[i.who]>=i.target)
                    addPool(trickValue,i.who)
                else {
                    addMountain(trickValue*(i.target-i.tricks[i.who]),i.who)
                    defenders.forEach(s=>addWhist(trickValue*(i.target-i.tricks[i.who]),s,i.who))
                    if (game.players===4)
                        addWhist(trickValue*(i.target-i.tricks[i.who]),i.rests,i.who)
                }
            } else { //round autoplayed
                addPool(trickValue,i.who)
                defenders.forEach(s=>{
                    if (i.whist[s]==="half-whist")
                        addWhist(4,s,i.who)
                })
            }

        }
        let determineClass = i=> i>0?"green-text":(i<0?"red-text":"")
        let createHtml = i=> `<span class="${determineClass(i)}">${addSign(i)}</span>`
        sides.forEach(s=>{
            score[s]=10*pool[s]-10*mountain[s];
            determinePlayers(s).forEach(s2=>{
                score[s]+=whists[s][s2]
                score[s]-=whists[s2][s]
            })
        })
        let totalScore = 0
        sides.forEach(s=>totalScore+=score[s])
        let sidesSorted = Object.entries(score).filter(([s,])=>s!=="north"||game.players===4).sort(([,a],[,b]) => a-b)
        if (game.players===3 && sidesSorted[0][0]==="north")
            sidesSorted.shift()
        if (game.players===3) {
            if (totalScore%3>=1)
                score[sidesSorted[0][0]]-=1
            if (totalScore%3>=2)
                score[sidesSorted[1][0]]-=1
            totalScore-=totalScore%3
        }
        if (game.players===4) {
            if (totalScore%4>=1)
                score[sidesSorted[0][0]]-=1
            if (totalScore%4>=2)
                score[sidesSorted[1][0]]-=1
            if (totalScore%4>=3)
                score[sidesSorted[2][0]]-=1
            totalScore-=totalScore%4
        }


        sides.forEach(s=>score[s]-=totalScore/game.players) //TODO TODO TODO
        sides.forEach(s=>$(`.${s} .score p`).html(`${createHtml(score[s])}<br><span>(${createHtml(score[s]-prevScore[s])})</span>`))

    })
    let poolSum = 0
    sides.forEach(s=>poolSum+=pool[s])
    if (game.target*game.players<=poolSum) {
        $("#target-input").addClass("white-text")
        $("#target-container").addClass("green")
        $(".pool p").append(" >> игра окончена (по очкам)")
    } else {
        $("#target-input").removeClass("white-text")
        $("#target-container").removeClass("green")
    }

}

typing = "propertychange change click keyup input paste";
$(".name-input").on(typing,(e)=>{
    e.target.style.setProperty(
        'width',
        Math.min(Math.max(6,e.target.value.length+1),20) + 'ch',
        'important'
    )
    let s = side($(e.target))
    $(` .${s} .name-text, .${s}.name-text`).text(e.target.value)
    game[s]=e.target.value
    update()
})
$("#target-input").on(typing,(e)=>{
    game.target=e.target.value
    update()
})

update()
$(".name-input").click()

document.addEventListener('DOMContentLoaded', function() {
    M.FloatingActionButton.init(document.querySelectorAll('#edit'), {
        direction: 'top',
        hoverEnabled: true
    });
});


//TODO placeholders for player names





$("#overlay").hide()
$(".collection").hide()


$("#overlay").on("click",()=>{
    $(".collection").hide("fast")
    $(".modal").hide("fast")
    $("#overlay").hide("fast")

})
$("#add").on("click",()=>{
    $("#overlay").show("fast")
    $("#what").show("fast")
})
let rests = "north";
let action;
let tricks = {};
$("#tricks .tricks-number").on("click",ev => {
    let e = $(ev.target)
    let clickedSide = side(e)
    $("."+clickedSide+" .tricks-number").removeClass("green")
    $("."+clickedSide+" .tricks-number").removeClass("white-text")
    e.addClass("green")
    e.addClass("white-text")
    let total = 0
    tricks = {}
    for (const s of sides) {
        if (rests===s) {
            continue
        }
        let select = $(`.${s} .tricks-number.green`)
        if (select.length) {
            let n = parseInt(select.text().replace(/[^0-9]/g, ''))
            total+=n
            tricks[s]=n
        }
        else {
            tricks[s]=0
            return
        }

    }
    if (total!==10) {
        M.toast({html: 'Сумма взяток не равна 10'})
        showTricks()
    } else {
        $("#tricks").hide("fast")
        $("#overlay").hide("fast")
        action()
    }

})
function showTricks() {
    $("#tricks > *").show()
    $("#tricks ."+rests).hide()
    $(".tricks-number").removeClass("green")
    $(".tricks-number").removeClass("white-text")
    $("#tricks").show("fast")
}
function showRests() {
    if (game["players"]===4)
        $("#rests").show("fast")
    else
        action()
}
$("#raspasi").on("click",()=>{
    action = () => {
        showTricks()
        action = () =>addRound({"type":"raspasi","rests":rests,"tricks":tricks})
    }
    showRests()
})
let whoPlays
let whom
let onWhom
$("#who-plays .option").on("click",e=>whoPlays=side($(e.target)))
$("#whom .option").on("click",e=>whom=side($(e.target)))
$("#on-whom .option").on("click",e=>onWhom=side($(e.target)))
let whist = {}
$(".whist-options .option").on("click",e=>    whist[side($(e.target))] = whistOption($(e.target)))
$("#who-plays .option, #whom .option, #on-whom .option, .whist-options .option").on("click",e=>{$(e.target).parent().hide("fast");action()})
function open(selector,hide=[]) {
    $(selector + " .collection-item").removeClass("force-hide")
    hide.forEach(i=>$(selector + " ." +i).addClass("force-hide"))
    $(selector).show("fast")
}

function getName(id) {
    return $("."+id + " .name-input").val()
}
function tricks2text(tricks,rests) {
    let res = ""
    Object.entries(tricks).forEach(([id,num])=>{
        if (id!==rests)
            res+=getName(id)+": "+num+", "
    })
    return res.substring(0, res.length - 2)+"."
}

let whistNames = {
    "whist":"вист",
    "half-whist":"полвиста",
    "pass":"пас"
}
function round2text(round) {
    if (round.type==="misere")
        return `${getName(round.who)}: мизер. Взятки - ${tricks2text(round.tricks,round.rests)}`
    if (round.type==="raspasi")
        return `Распасы. Взятки - ${tricks2text(round.tricks,round.rests)}`
    if (round.type==="for-tricks") {
        let whists = Object.entries(round.whist)
        if (round.hasOwnProperty("tricks")) {
            return `${getName(round.who)}: ${round.target}, ${getName(whists[0][0])}: ${whistNames[whists[0][1]]}, ${getName(whists[1][0])}: ${whistNames[whists[1][1]]}. Взятки - ${tricks2text(round.tricks,round.rests)}`
        } else
            return `${getName(round.who)}: ${round.target}, ${getName(whists[0][0])}: ${whistNames[whists[0][1]]}, ${getName(whists[1][0])}: ${whistNames[whists[1][1]]}.`
    }
    if (round.type==="pool")
        return `${getName(round.who)} в пулю ${addSign(round.value)}`
    if (round.type==="mountain")
        return `${getName(round.who)} в гору ${addSign(round.value)}`
    if (round.type==="whist")
        return `${getName(round.who)} висты на ${getName(round.on)} ${addSign(round.value)}`

}
let undoneRounds = []
function addRound(round,clear=true) {
    game.rounds.push(round)
    M.toast({'html':round2text(round)})
    update()
    if (clear)
        undoneRounds=[]
}

function undo() {
    var last = game.rounds.pop()
    if (typeof(last)==="undefined")
        M.toast({"html":"Не осталось раундов"})
    else {
        update()
        undoneRounds.push(last)
        M.toast({"html":"Удален раунд: " + round2text(last)})
    }
}
function redo() {
    var last = undoneRounds.pop()
    if (typeof(last)==="undefined")
        M.toast({"html":"Не осталось раундов"})
    else {
        addRound(last,false)
        update()
    }
}
$("#misere").on("click",()=>{
    action = () => {
        open("#who-plays",[rests])
        action = () => {
            showTricks()
            action = () => addRound({"type": "misere", "rests": rests,"who":whoPlays, "tricks": tricks})

        }
    }
    showRests()
})
let target
$("#for-tricks").on("click",()=>{

    action = () => {
        open("#who-plays",[rests])
        action = () =>{
            $("#game").show("fast")
            action = () => {
                whist={}
                let whistPlayers = sides.filter(i=>
                    i!==rests&&i!==whoPlays
                )
                $(".whist-options."+whistPlayers[0]).show("fast")
                action = ()=>{
                    $(".whist-options."+whistPlayers[1]).show("fast")
                    action = () => {
                        if (Object.values(whist).filter(i=>i==="whist").length===0) {
                            addRound({"type": "for-tricks", "rests": rests,"who":whoPlays, "target":target,"whist":whist})
                            $("#overlay").hide("fast")
                            update()
                        } else {
                            showTricks()
                            action = () => addRound({"type": "for-tricks", "rests": rests,"who":whoPlays,"target":target, "whist":whist,"tricks":tricks})
                        }
                    }
                }
            }
        }

    }
    showRests()
})
function showValue() {
    $("#value input").val("")
    $("#value input").click()
    $("#value").show("fast")
}
let value
$("#manual").on("click",()=>{$("#manual-options").show("fast")})
$("#manual-options").on("click",()=>$("#manual-options").hide())

$("#manual-mountain").on("click",()=>{
    open("#whom",game.players===4?[]:["north"])
    action = () => {
        showValue()
        action = () => {
            addRound({"type":"mountain","who":whom,"value":value})
            $("#overlay").hide("fast")
        }
    }
})
$("#manual-pool").on("click",()=>{
    open("#whom",game.players===4?[]:["north"])
    action = () => {
        showValue()
        action = () => {
            addRound({"type":"pool","who":whom,"value":value})
            $("#overlay").hide("fast")
        }
    }
})
$("#manual-whist").on("click",()=>{
    open("#whom",game.players===4?[]:["north"])
    action = () => {
        open("#on-whom",game.players===4?[whom]:["north",whom])
        action = () => {
            showValue()
            action = () => {
                addRound({"type":"whist","who":whom,"on":onWhom,"value":value})
                $("#overlay").hide("fast")
            }
        }
    }
})

$("#value .btn-floating").on("click",()=>{
    value = parseInt($("#value input").val())
    $("#value").hide("fast")
    action()
})


$("#what .collection-item").on("click",()=>{
    $("#what").hide("fast")
})
$("#rests .collection-item").on("click",(e)=>{
    $("#rests").hide("fast")
    rests = side($(e.target));
    action()
})
$("#game .collection-item").on("click",e=>{
    $("#game").hide("fast")
    target = parseInt($(e.target).text())
    action()
})

$("#value input").on(typing,(e)=>{
    if (document.querySelector("#value input").checkValidity())
        $("#value .btn-floating").show()
    else
        $("#value .btn-floating").hide()
})
$("#value input").click()
$("#value input").on("keyup",e=>{
    if (e.key==="Enter" && e.target.checkValidity())
        $("#value .btn-floating").click()
})

function restart() {
    if (confirm("Начать новую игру?")) {
        game=defaultGame
        update()
    }

}

function changePlayers() {
    for (const i of game.rounds) {
        if (i.who==="north"||i.on==="north"||(i.hasOwnProperty("tricks")&&i.tricks.hasOwnProperty("north"))||i.rests!=="north") {
            M.toast({"html":"Нельзя поменять количество игроков, потому что четвертый игрок принимал участие в игре"})
            return
        }
    }
    game.players = game.players===3?4:3;
    M.toast({html: game.players + ' игрока'})
    update()
}

let candelabraIsShown=false
$("#logo-container").on("click",()=> {
    if (candelabraIsShown) {
        candelabraIsShown=false;
        $("#candelabra").hide("fast")
    } else {
        candelabraIsShown=true;
        $("#candelabra").show("fast")
    }
}
)
$("#candelabra").hide()
$("#candelabra").on("click",()=>M.toast({"html":"Нажмите на лого, чтобы скрыть канделябр"}))

document.addEventListener('DOMContentLoaded', function() {
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems, {});
});

function about() {
    $("#about").show("fast")
    $("#overlay").show("fast")
}
$("#about .modal-close").on("click",()=>$("#overlay").click())