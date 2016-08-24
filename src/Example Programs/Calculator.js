var readline = require('readline');
var math = require('mathjs');
var path = require('path');
var fs = require('fs');
var RPNParser = require('./rpn_parser.js')

var parser = new RPNParser(math, alt);

//Platform Specific Stuff.
function render()
{
    for(var i =0; i< parser.stacker.length; i++)
    {
        console.log(parser.stacker[i].toString());
    }
}

function alt(x)
{
    setTimeout(function() { console.log("Error on Token: " + x); }, 100);
}

function init()
{
    parser.addExtension(node_ext);
    var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
    });
    function a()
    {
        console.log("========================");
        rl.question("", function(answer)
        {
            parser.parse(answer);
            console.log("------------------------");
            render();
            setTimeout(a, 100);
        });
    }
    a();
}


//Extra here
var svars = {};
var svarPath = path.dirname(process.argv[1]) + "/svar.json";

try
{
    fs.accessSync(svarPath, fs.F_OK);
    loadVars();
} catch (e)
{
    saveVars();
}

function loadVars()
{
    svars = JSON.parse(fs.readFileSync(svarPath).toString());
}

function saveVars()
{
    fs.writeFileSync(svarPath, JSON.stringify(svars));
}

function node_ext(word)
{
    if(word.indexOf("->") == 0)
    {
        word = word.substring(2);
        if(word.length == 0) return false;

        svars[word] = parser.peek();
        saveVars();
        return true;
    }
    else
    if(word.indexOf("<-") == 0)
    {
        word = word.substring(2);
        if(word.length == 0) return false;

        parser.push(svars[word]);
        if(parser.peek() == undefined)
        {
             parser.pop();
             alt("No such global variable - " + word);
        }
        return true;
    }
    else
    if(word == "gclear")
    {
        svars = {};
        saveVars();
        return true;
    }
    else
    if(word.indexOf("d>") == 0)
    {
        word = word.substring(2);
        if(word.length == 0) return false;

        delete svars[word];
        saveVars();
        return true;
    }

    return false;
}
//Extra end


init();
