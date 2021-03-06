//Requires mathjs to function
function RPNParser(math, alt)
{
  var conversions = {};
  var stacker = [];
  var vars = {};
  var added_extensions = [];

  function makeConversionChain(chainName, root)
  {
    conversions[chainName] = {};
    conversions[chainName][root] = 1;
  }

  function pullConversions(destChainName, sourceChainName, destBase, sourceBase, proc)
  {
    var keys = Object.keys(conversions[sourceChainName]);
    var a = proc(sourceBase, sourceBase);
    addConversion(destChainName, destBase, a[0], 1);
    for(var i = 0; i < keys.length; i++)
    {

      if(keys[i] == sourceBase) continue;
      a = proc(sourceBase, keys[i]);
      addConversion(destChainName, destBase, a[0], a[1]);
    }
  }

  function reverseRPN(sentence)
  {
    var result = " ";
    sentence = sentence.split(" ");

    var a = ["+", "-", "/", "*", "^", "%", "mod"];
    var b = ["-", "+", "*", "/", "1 swap / ^", "%", "mod"];
    var count = 0;

    var curr_string = "";

    for(var i = 0; i < sentence.length; i++)
    {
      if(sentence[i].length == 0) continue;
      var c = a.indexOf(sentence[i]);
      if(c === -1)
      {
        count++;
        curr_string += sentence[i] + " ";
      }
      else
      {
        if(count == 1)
        {
          result = curr_string + b[c] + " " + result;
          curr_string = "";
        }
        else
        {
          curr_string += sentence[i] + " ";
        }
        count--;
      }
    }

    result = curr_string + result;

    return result;
  }

  function addConversion(chainName, node1, node2, val)
  {
    //Adding Array Support
    if(node2 instanceof Array)
    {
        for(var j = 0; j < node2.length; j++)
        {
            addConversion(chainName, node1, node2[j], val);
        }
        return;
    }

    var a = conversions[chainName][node1];
    if(a !== undefined)
    {
      if (typeof a === 'string' || a instanceof String)
      {
        conversions[chainName][node2] = (a) + val + " ";
      }
      else
      conversions[chainName][node2] = a * val;
    }
  }

  function duplicateConversion(chainName, node1, node2)
  {

    if(node2 instanceof Array)
    {
      for(var i = 0; i < node2.length; i++)
      {
        duplicateConversion(chainName, node1, node2[i]);
      }
      return;
    }

    if(conversions[chainName][node1] !== undefined)
    {
      conversions[chainName][node2] = conversions[chainName][node1];
    }
  }

  function convert(chainName, val, node1, node2)
  {
    var a = conversions[chainName][node1];
    var b = conversions[chainName][node2];
    if(a === undefined || b === undefined) return 0;


    if ((typeof a === 'string' || a instanceof String) && (typeof b === 'string' || b instanceof String))
    {
      //alt(val + " " + reverseRPN(a) + " " + b);
      return (val + " " + reverseRPN(a) + " " + b);
    }

    return math.multiply(math.divide(val, conversions[chainName][node1]), conversions[chainName][node2]);
  }

  function initConversions()
  {
    function simp(a,b)
    {
      makeConversionChain("metric", "none");
      for(var i = 0; i < a.length; i++)
      {
        addConversion("metric", "none", a[i], 1/b[i]);
      }
      addConversion("metric", "none", "", 1);
      addConversion("metric", "none", "normal", 1);
    }

    var a = ["exa", "peta", "tera", "giga", "mega", "kilo", "hecto", "deca", "deci", "centi", "milli", "micro", "nano", "pico", "femto", "atto"];
    var b = [1e18, 1e15, 1e12, 1e9, 1e6, 1e3, 1e2, 1e1, 1e-1, 1e-2, 1e-3, 1e-6, 1e-9, 1e-12, 1e-15, 1e-18];

    simp(a,b);

    //adds commonly accepted abbreviations
    function abbreviationQuickFix(source, post, post2)
    {
      addConversion(source, "kilo" + post, "k" + post2, 1);
      addConversion(source, "centi" + post, "c" + post2, 1);
      addConversion(source, "milli" + post, "m" + post2, 1);
      addConversion(source, "nano" + post, "n" + post2, 1);
      addConversion(source, "micro" + post, "u" + post2, 1);
      addConversion(source, "pico" + post, "p" + post2, 1);
      addConversion(source, "femto" + post, "f" + post2, 1);
    }

    makeConversionChain("dist", "m");
    addConversion("dist", "m", "meter", 1);

    //Adds metric versions of distance.
    pullConversions("dist", "metric", "m", "", function(s,o)
    {
      var a = convert("metric", 1, s, o);
      return [[o+"meter", o+"meters"], a];
    });

    //adds metric abbreviations.
    abbreviationQuickFix("dist", "meter", "m");

    //adds American units.
    addConversion("dist", "cm", ["in", "inch", "inches"], .3937);
    addConversion("dist", "in", ["ft", "feet"], 1 / 12);
    addConversion("dist", "ft", ["yd", "yards"], 1 / 3);
    addConversion("dist", "ft", ["mi", "mile", "miles"], 1 / 5280);
    addConversion("dist", "m", ["nautical_mile", "Nautical-Mile", "Nautical_Mile", "nautical-mile"], 1 / 1852);

    makeConversionChain("angle", "rad");
    addConversion("angle", "rad", "deg", 180 / Math.PI);
    addConversion("angle", "rad", "radian", 1);
    addConversion("angle", "deg", "degree", 1);
    addConversion("angle", "degree", "degrees", 1);
    addConversion("angle", "radian", "radians", 1);

    makeConversionChain("volume", "cup");
    addConversion("volume", "cup", ["Cup", "cups", "Cups"], 1);
    addConversion("volume", "cup", ["tsp", "teaspoon", "Teaspoon", "teaspoons", "Teaspoons"], 48);
    addConversion("volume", "cup", ["tbsp", "tablespoon", "Tablespoon", "tablespoons", "Tablespoons"], 16);
    addConversion("volume", "cup", ["oz", "floz", "OZ"], 8);
    addConversion("volume", "cup", ["pint", "Pint", "pints", "Pints"], 1/2);
    addConversion("volume", "pint", ["quart", "Quart", "quarts", "Quarts"], 1/2);
    addConversion("volume", "quart", ["gallon", "Gallon", "gallons", "Gallons", "gal", "Gal"], 1/4);
    addConversion("volume", "gallon", ["liter", "Liter", "L", "l"], 3.78541);
    addConversion("volume", "liter", ["mL", "ml"], 1000);
    addConversion("volume", "liter", ["cubic_m", "m^3", "cubic_meter", "cubic_meters"], 1 / 1000);
    pullConversions("volume", "dist", "mL", "cm", function(s, o)
    {
      var a = convert("dist", 1, s, o);
      a = Math.pow(a,3);
      return [o + "^3", a];
    });


    makeConversionChain("temp", "F");
    conversions["temp"]["F"] = "";
    addConversion("temp", "F", "C", "32 - 5 9 / *");
    addConversion("temp", "C", "K", "273.15 +");
    addConversion("temp", "F", "R", "459.67 +");

    makeConversionChain("pressure", "atm");
    addConversion("pressure", "atm", ["Atmosphere", "atmosphere", "atmospheres", "Atmospheres"], 1);
    addConversion("pressure", "atm", "bar", 1.01325);
    addConversion("pressure", "atm", ["pa", "Pa", "Pascals", "Pascal"], 101325);
    addConversion("pressure", "atm", "psi", 14.6959);

    makeConversionChain("time", "s");
    addConversion("time", "s", ["seconds", "second"], 1);
    addConversion("time", "s", ["ms", "millisecond", "milliseconds", "Millisecond", "Milliseconds"], 1000);
    addConversion("time", "s", ["m", "minute", "minutes", "Minute", "Minutes"], 1/60);
    addConversion("time", "m", ["h", "hour", "hours", "Hour", "Hours"], 1/60);
    addConversion("time", "h", ["d", "day", "days", "Day", "Days"], 1/24);
    addConversion("time", "d", ["y", "year", "years", "Years", "Year"], 1/365);
    addConversion("time", "y", ["decade", "Decade", "Decades", "decades"], 1 / 10);
    addConversion("time", "decade", ["century", "Century", "centuries", "Centuries"], 1 / 10);

    makeConversionChain("mass", "kg");
    addConversion("mass", "kg", "g", 1e3);

    //pulls metric into the mass.
    pullConversions("mass", "metric", "g", "", function(s,o)
    {
      var a = convert("metric", 1, s, o);
      return [[o+"gram", o+"grams"], a];
    });

    //adds common abbreviations to mass.
    abbreviationQuickFix("mass", "gram", "g");

    addConversion("mass", "g", "amu", 1 / 1.66054e-24);
    addConversion("mass", "kg", "lbs", 1 / 0.453592);
    addConversion("mass", "lbs", "slug", 1 / 32.174);
    addConversion("mass", "lbs", ["pounds", "pound", "Pound", "Pounds", "lb", "lbm"], 1);
    addConversion("mass", "lbs", "oz", 16);
    addConversion("mass", "lbs", ["ton", "us_ton", "tons"], 1/2000);
    addConversion("mass", "kg", ["tonne", "metric_ton", "tonnes"], 1/1000);

    makeConversionChain("force", "N");
    addConversion("force", "N", ["Newton", "newton"], 1);
    addConversion("force", "N", ["lbs", "lbf", "pound", "Pound"], 0.224809);

    makeConversionChain("energy", "J");
    addConversion("energy", "J", ["Joule", "joule"], 1);
    addConversion("energy", "J", ["cal", "calorie", "Gram-Calorie"], 0.239006);
    addConversion("energy", "cal", ["Cal", "Calorie", "Food-Calorie", "Kilocalorie"], 1 / 1000);
    addConversion("energy", "J", ["KJ", "Kilojoule", "kilojoule"], 1 / 1000);
    addConversion("energy", "J", ["BTU", "BritishThermalUnit"], 0.000947817);

    makeConversionChain("cpu", "byte");
    duplicateConversion("cpu", "byte", "B");

    addConversion("cpu", "B", "KiB", 1 / 1024);
    addConversion("cpu", "KiB", "MiB", 1 / 1024);
    addConversion("cpu", "MiB", "GiB", 1 / 1024);
    addConversion("cpu", "GiB", "TiB", 1 / 1024);
    addConversion("cpu", "TiB", "PiB", 1 / 1024);

    addConversion("cpu", "B", "KB", 1 / 1000);
    addConversion("cpu", "KB", "MB", 1 / 1000);
    addConversion("cpu", "MB", "GB", 1 / 1000);
    addConversion("cpu", "GB", "TB", 1 / 1000);
    addConversion("cpu", "TB", "PB", 1 / 1000);

    addConversion("cpu", "B", "b", 8);
    duplicateConversion("cpu", "b", "bit");

    addConversion("cpu", "b", "Kib", 1 / 1024);
    addConversion("cpu", "Kib", "Mib", 1 / 1024);
    addConversion("cpu", "Mib", "Gib", 1 / 1024);
    addConversion("cpu", "Gib", "Tib", 1 / 1024);
    addConversion("cpu", "Tib", "Pib", 1 / 1024);

    addConversion("cpu", "b", "Kb", 1 / 1000);
    addConversion("cpu", "Kb", "Mb", 1 / 1000);
    addConversion("cpu", "Mb", "Gb", 1 / 1000);
    addConversion("cpu", "Gb", "Tb", 1 / 1000);
    addConversion("cpu", "Tb", "Pb", 1 / 1000);
  }
  initConversions();


  function dsin(x)
  {
    return math.sin(math.divide(math.multiply(x, Math.PI), 180));
  }


  function dcos(x)
  {
    return math.cos(math.divide(math.multiply(x, Math.PI), 180));
  }


  function dtan(x)
  {
    return math.tan(math.divide(math.multiply(x, Math.PI), 180));
  }

  function rsin(x)
  {
    return math.sin(x);
  }

  function rcos(x)
  {
    return math.cos(x);
  }

  function rtan(x)
  {
    return math.tan(x);
  }

  function pop(f)
  {
    var f = ((f === undefined) ? false : f);
    if(stacker.length == 0) return 0;
    if(!f && Array.isArray(peek())) return stacker.pop()[0];
    return stacker.pop();
  }

  //peek string function, returns empty string if nothing to be returned
  function peeks()
  {
    if(stacker.length == 0) return "";
    return "" + peek();
  }

  //peek number function, returns 0 if stack is empty
  function peek()
  {
    if(stacker.length == 0) return 0;
    return stacker[stacker.length - 1];
  }

  function push(x)
  {
    if(!Array.isArray(x)) x = [x];
    stacker.push(x);
  }

  function save(x,y)
  {
    vars[x] = y;
  }

  function load(x)
  {
    return vars[x];
  }

  function tryExtensions(word)
  {
    for(var i = 0; i < added_extensions.length; i++)
    {
      if(added_extensions[i](word)) return true;
    }
    return false;
  }


  function chemistryConstants(word)
  {
    if(word.toLowerCase() == "avogadro")
    {
      push(6.0221409e+23);
    }
    else return false;
    return true;
  }

  function physicsConstants(word)
  {
      if(word == "K2")
      {
        push(8.9876e9);
      }
      else
      if(word == "K")
      {
        push(1 / (Math.PI * 8.854e-12 * 4));
      }
      else
      if(word == "Uo")
      {
        push(4*Math.PI*1e-7);
      }
      else
      if(word == "ec" || word == "elec")
      {
        push(1.602e-19);
      }
      else
      if(word == "electronMass")
      {
        push(9.10938356e-31);
      }
      else
      if(word == "protonMass")
      {
        push(1.6726e-27);
      }
      else
      if(word == "Eo")
      {
        push(8.854e-12);
      }
      else
      if(word == "error")
      {
        parse("%perE del %perA del $perE $perA - $perA / 100 *");
      }
      else
      {
        return false;
      }
      return true;
  }

  function basicMathOperations(word)
  {
      if(word == "!")
      {
        push(math.factorial(pop(true)));
      }
      else
      if(word == "rand")
      {
        var n = pop(true);
        for(var j = 0; j < n.length; j++)
        {
          n[j] = Math.floor(Math.random() * 100000 % n[j]);
        }
        push(n);
      }
      else
      if(word == "round")
      {
        push(math.round(pop(true)));
      }
      else
      if(word == "floor")
      {
        push(math.floor(pop(true)));
      }
      else
      if(word == "ceil")
      {
        push(math.ceil(pop(true)));
      }
      else
      if(word == "lcm")
      {
        push(math.lcm(pop(true), pop(true)));
      }
      else
      if(word == "gcd")
      {
        push(math.gcd(pop(true), pop(true)));
      }
      else
      if(word == "pyth")
      {
        if(peek().length == 2)
        parse("mag");
      }
      else
      if(word == "abs")
      {
        push(math.abs(pop(true)));
      }
      else
      if(word == "min" || word == "max" || word == "lcm2" || word == "gcd2")
      {
        var a = pop(true);
        var b = a[0];
        var c = math.min;

        switch(word)
        {
          case "max":
            c = math.max;
          break;
          case "lcm2":
            c = math.lcm;
          break;
          case "gcd2":
              c = math.gcd;
          break;
        }

        for(var i = 1; i < a.length; i++)
        {
          b = c(b, a[i]);
        }
        push(b);
      }
      else
      if(word == "ln")
      {
        push(math.log(pop(true)));
      }
      else
      if(word == "log")
      {
        push(math.log(pop(true)) / math.log(10));
      }
      else
      if(word == "acc")
      {
        var b = pop();
        var a = pop(true);
        push(math.divide(math.round(math.multiply(a, math.pow(10, b))),math.pow(10, b)));
      }
      else
      return false;
    return true;

  }

  function fraction(x)
  {
    function frac(x)
    {
        if((""+x).indexOf(".") != -1)
        {
          var w = ("" + x).split(".");
          w[0] = parseInt(w[0]);
          w[1] = parseInt(w[1]);
          return [ w[1], math.pow(10, (""+w[1]).length), w[0]];
        }
        else
        {
            return [0, 1, x];
        }
    }

    var a = frac(x);
    var gcd = math.gcd(a[0], a[1]);
    return [a[2]*(a[1]/gcd) + a[0]/gcd, a[1]/gcd];
  }

  function extensions(word)
  {
    // this part needs refractored at some point. It barely works.
    if(word == "frac" || word == "fraction")
    {
      var a = pop(true);
      var b = [];
      for(var i = 0; i < a.length; i++)
      {
          b = b.concat(fraction(a[i]));
      }
      push(b);
    }
    else
    if (word == "seq")
    {
      var a = pop(true);
      if(a.length >= 2)
      {
        var b = 1;
        if(a.length == 3)
        {
          b = a[2];
        }
        var arr = [];

        if(a[0] < a[1])
        {
          for(var i = a[0]; i <= a[1]; i += b)
          {
            arr.push(i);
          }
        }
        else
        {
          for(var i = a[0]; i >= a[1]; i -= b)
          {
            arr.push(i);
          }
        }
        push(arr);
      }
      else return false;
    }
    else
    if (word == "combination" || word == "nCr" || word == "comb")
    {
      var a = pop(true);
      push(math.combinations(a[0], a[1]));
    }
    else
    if (word == "permutation" || word == "perm" || word == "nPr")
    {
      var a = pop(true);
      push(math.permutations(a[0], a[1]));
    }
    else
    if (word == "multinomial")
    {
      var a = pop(true);
      push(math.multinomial(a));
    }
    else
    if (word == "sigfig" || word == "sig" || word == "sig_fig")
    {
      var a = pop(true);
      var c = [0, 1];
      var s = a[0].toPrecision(a[1]).split("e");
      if(s.length != 1)
      {
        c[1] = parseFloat(s[1]);
      }
      c[0] = parseFloat(s[0]);
      push(c);
    }
    else return false;
    return true;
  }

  function conversion(word)
  {
    var w = word.split("|");
    if(w.length == 3)
    {
      if(conversions[w[0]] !== undefined)
      {
        if(conversions[w[0]][w[1]] !== undefined && conversions[w[0]][w[2]] !== undefined)
        {
          var result = convert(w[0], pop(true), w[1], w[2]);
          if (typeof result === 'string' || result instanceof String)
          {
            parse(result);
          }
          else
          {
            push(result);
          }
          return true;
        }
      }
    }

    return false;
  }

  function trigonometry(word)
  {
      if(word == "asin")
      {
        push(math.asin(pop(true)));
      }
      else
      if(word == "acos")
      {
        push(math.acos(pop(true)));
      }
      else
      if(word == "asin")
      {
        push(math.acos(pop(true)));
      }
      else
      if(word == "dcos")
      {
        push(dcos(pop(true)));
      }
      else
      if(word == "dsin")
      {

        push(dsin(pop(true)));
      }
      else
      if(word == "dtan")
      {

        push(dtan(pop(true)));
      }
      else
      if(word == "rcos")
      {
        push(rcos(pop(true)));
      }
      else
      if(word == "rsin")
      {

        push(rsin(pop(true)));
      }
      else
      if(word == "rtan")
      {

        push(rtan(pop(true)));
      }
      else
      if(word == "atan")
      {
        push(math.atan(pop(true)));
      }
      else
      if(word == "PI")
      {
        push(Math.PI);
      }
      else
      if(word == "e" || word =="E")
      {
        push(Math.E);
      }
      else
      return false;
      return true;
  }

  function parse(x)
  {
    var dat = x.split(" ");

    var arithmeticSymbols = ["+", "-", "/", "*", "%", "^", "mod"];
    for(var i = 0; i < dat.length; i++)
    {
      var word = dat[i];
      if(word.length == 0) continue;

      if(word.indexOf("..") != -1)
      {
        var a = parseInt(word.split("..")[0]);
        var b = parseInt(word.split("..")[1]);
        if(isNaN(a)) a = parseInt(""+load(word.split("..")[0]));
        if(isNaN(b)) b = parseInt(""+load(word.split("..")[1]));

        if(!isNaN(a) && !isNaN(b))
        {
          push([a,b]);
          parse("seq");
        }
      }
      else
      if(word.charCodeAt(0) == '%'.charCodeAt(0) && word.length != 1)
      {
        var n = peeks();
        save(word.substring(1), n);
      }
      else
      if(word.charCodeAt(0) == '$'.charCodeAt(0) && word.length != 1)
      {
        parse(load(word.substring(1)));
      }
      else //various extensions
      if(basicMathOperations(word) || conversion(word) || physicsConstants(word) || chemistryConstants(word));
      else
      if(arithmeticSymbols.indexOf(word) != -1 && arithmetic(word));
      else
      if(trigonometry(word) || vector(word) || extensions(word) || tryExtensions(word));
      else //extensions end
      if(word == "pop" || word == "del")
      {
        pop();
      }
      else
      if(word == "@size")
      {
        push(stacker.length);
      }
      else
      if(word == "dup")
      {
        push(clone(peek()));
      }
      else
      if(word == "clear")
      {
        var t = stacker;
        stacker = [];
        delete t;
      }
      else
      if(word == "swap")
      {
        var t = stacker[stacker.length -1];
        stacker[stacker.length-1] = stacker[stacker.length-2];
        stacker[stacker.length-2] = t;
      }
      else
      if(tryVector(word));
      else
      {
        if(!isNaN(parseFloat(word)))
        {
          push(parseFloat(word));
        }
        else
        alt(word);
      }
    }
  }

  function clone(obj)
  {
    return JSON.parse(JSON.stringify(obj));
  }

  function arithmetic(word)
  {
    var b = pop(true);
    var a = pop(true);

    if(b.length != a.length)
    {
      if(a.length == 1)
      {
        var t = b;
        b = a[0];
        a = t;
      }
      else
      if(b.length == 1)
      {
        b = b[0];
      }
      else
      return false;
    }

    if(word == "+")
    {
      push(math.add(a, b));
    }
    else
    if(word == "^")
    {
      b = b[0];
      for(var j = 0; j < a.length; j++)
      {
        a[j] = Math.pow(a[j],b);
      }
      push(a);
    }
      else
    if(word == "-")
    {
      push(math.subtract(a,b));
    }
    else
    if(word == "/")
    {
      push(math.divide(a, b));
    }
    else
    if(word == "*")
    {
      push(math.multiply(a,b));
    }
    else
    if(word == "%" || word == "mod")
    {
      push(math.mod(a,b));
    }
    else
    return false;
    return true;
  }


  function tryVector(word)
  {
    if(word.indexOf(",") != -1 && word.indexOf(",") != 0)
    {
      var br = word.split(",");
      var arr1 = [];
      for(var i = 0; i < br.length; i++)
      {
        if(!isNaN(parseFloat(br[i])))
        {
          arr1.push(parseFloat(br[i]));
        } else return false;
      }

      push(arr1);
      return true;
    }

    return false;
  }

  function vector(word)
  {
    if(word == "dot")
    {
      push(math.dot(pop(true), pop(true)));
      return true;
    }
    else
    if(word == "cross")
    {
      push(math.cross(pop(true), pop(true)));
      return true;
    }
    else
    if(word == "magnitude" || word == "mag")
    {
      push(math.norm(pop(true)));
      return true;
    }
    else
    if(word == "unitVector")
    {
      parse("dup mag /");
      return true;
    }
    else
    if(word == "dist")
    {
      push(math.distance(pop(true), pop(true)));
      return true;
    }
    else
    if(word == "vecGen")
    {
      parse("%vecd dup dcos swap dsin 2 vec *");
      return true;
    }
    if(word == "at")
    {
      var loc = pop();
      var arr = pop(true);
      push(arr[loc]);
      return true;
    }
    else
    if (word == "vecAngle")
    {
      parse("dup mag / dup 0 at acos deg swap 1 at asin deg");
      return true;
    }
    else
    if (word == "directionCosines")
    {
      parse("unitVector acos");
      return true;
    }
    else
    if (word == "directionSines")
    {
      parse("unitVector asin");
      return true;
    }
    else
    if (word == "multVector" || word == "divVector")
    {
      var b = pop(true);
      var a = pop(true);
      var lim = Math.min(a.length, b.length);
      var c = [];
      for(var i = 0; i < lim; i++)
      {
        if(word == "multVector")
        {
          c.push(a[i] * b[i]);
        }
        else
        {
          c.push(a[i] / b[i]);
        }
      }
      push(c);
      return true;
    }
    else
    if ( word == "sum" || word == "product" )
    {
      var a = pop(true);
      var sum = 0;
      for(var i = 0; i < a.length; i++)
      {
        if(word == "sum")
        {
          sum += a[i];
        }
        else
        {
          if(i==0)
            sum = 1;
          sum *= a[i];
        }
      }
      push(sum);
      return true;
    }
    else
    if ( word == "merge" || word == "union" || word == ",")
    {
      var a = pop(true);
      var b = pop(true);
      push(merge(b, a));
      return true;
    }
    else
    if (word == "sort")
    {
      push(math.sort(pop(true)));
      return true;
    }
    else
    if ( word == "uniq" )
    {
      push(uniq(pop(true)));
      return true;
    }
    else
    if ( word == "reverse" )
    {
      push(pop(true).reverse());
      return true;
    }
    else
    if ( word == "mean" )
    {
      push(math.mean(pop(true)));
      return true;
    }
    else
    if ( word == "median" )
    {
      push(math.median(pop(true)));
      return true;
    }
    else
    if ( word == "mode" )
    {
      push(math.mode(pop(true)));
      return true;
    }
    else
    if ( word == "pick" )
    {
      push(math.pickRandom(pop(true)));
      return true;
    }
    else
    if ( word == "decompose" )
    {
      var a = pop(true);
      for(var i = 0; i < a.length; i ++)
      {
        push(a[i]);
      }
      return true;
    }
    else
    if ( word == "std" )
    {
      push(math.std(pop(true)));
      return true;
    }
    else
    if ( word == "intersection" )
    {
      var a = pop(true);
      var b = pop(true);
      var c = [];
      for(var i = 0; i < a.length; i++)
      {
        if(b.indexOf(a[i]) != -1)
        {
          c.push(a[i]);
          b.splice(b.indexOf(a[i]), 1);
        }
      }
      push(c);
      return true;
    }
    else
    if (word == "diff")
    {
      var b = pop(true);
      var a = pop(true);

      for(var i = 0; i < b.length; i++)
      {
        if(a.indexOf(b[i]) != -1)
        {
          a.splice(a.indexOf(b[i]), 1);
        }
      }

      push(a);
      return true;
    }
    else
    if (word == "udiff")
    {
      parse("%b pop %a $b diff $b $a diff union");
      return true;
    }

    return false;
  }

  function uniq(a) {
      var seen = {};
      return a.filter(function(item) {
          return seen.hasOwnProperty(item) ? false : (seen[item] = true);
      });
  }

  function merge(a, b)
  {
    return a.concat(b);
  }

  this.parse = parse;
  this.getStack = function()
  {
    return stacker;
  }
  this.peeks = peeks;
  this.pop = pop;
  this.peek = peek;
  this.push = push;
  this.addExtension = function(a)
  {
    added_extensions.push(a);
  }
}

if(typeof(module) === "undefined" || typeof(module.exports) === "undefined");
else
{
    module.exports = RPNParser;
}
