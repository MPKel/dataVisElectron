let $ = require('jquery')  // jQuery now loaded and assigned to $
$(document).ready(function(){
var d3 = require("d3")


let overrideDate, overrideDateUTC, overrideDateUTC_usable, overrideEngDate, overrideId;

$.get("https://aycl.uie.com/?ACT=129&k=cbg8tj5bmv1bk3rc&a=vl", function(data) {
  let videosOBJ = JSON.parse(data);
   for(let i=0; i < videosOBJ.videos.length; i++ ) {

     $("#vsSelection").append(`<option value=${videosOBJ.videos[i].entry_id}>${videosOBJ.videos[i].vs_title} -- ${videosOBJ.videos[i].instructor_first_name} ${videosOBJ.videos[i].instructor_last_name}</option>`)

   }


 }, "text");



$("#submitDate").click( function () {
  overrideDate = document.getElementById('overDate').value;
  overrideId = document.getElementById('vsSelection').value;
  let holder = overrideDate.split('-');
  overrideDateUTC = new Date(holder[0], holder[1]-1, holder[2]);
  overrideDateUTC_usable = overrideDateUTC / 1000;



  overrideEngDate = new Date(overrideDateUTC);

  d3.select("#uniqueSVG").empty();
  getStats();
});



  $('nav li ul').hide().removeClass('fallback');
$('nav li').hover(
  function () {
    $('ul', this).stop().slideDown(100);
  },
  function () {
    $('ul', this).stop().slideUp(1100);
  }
);

let activeIndex;





  $('.select_button').click(function(){
        setActiveIndex(this.value)
    });


let halfBool = false;
let watchesBool = true;
let bothBool = false;

    $('input:radio[name="graphWhat"]').change(function() {
           if ($(this).val() == '1') {
               watchesBool = true;
               halfBool = false;
               bothBool = false;
               if(overrideDate){
                 d3.select("#uniqueSVG").empty();
                 getStats();
             }

           }
           else if ($(this).val() == '2'){
             halfBool = true;
             watchesBool = false;
             bothBool = false;
            if(overrideDate){
               d3.select("#uniqueSVG").empty();
               getStats();
            }
           }
           else {
             bothBool = true;
              if(overrideDate){
             d3.select("#uniqueSVG").empty();
             getStats();
           }
           }
       });






    $('#isHalfSelected').change(function() {
      // this will contain a reference to the checkbox
      if (this.checked) {
        halfBool = true;
        d3.select("#uniqueSVG").empty();
        getStats();
          // the checkbox is now checked
      } else {
        halfBool = false;
        d3.select("#uniqueSVG").empty();
        getStats();
      }
  });




let drawArray = [
      {
          date: 0,
          watchTally: 0,
          halfTally: 0
      }

  ];








var buildDateArray = function(send, dif) {

    var startDate = new Date(send).setDate(new Date(send).getDate() - dif);
    var endDate = new Date(send).setDate(new Date(send).getDate() + dif);


    var arr = new Array();
    var dt = new Date(startDate);
    while (dt <= endDate) {
        arr.push({  date: new Date(dt).toDateString(),
                    watchTally: 0,
                    halfTally: 0,
                   });
        dt.setDate(dt.getDate() + 1);
    }
    return arr;
}




const _MS_PER_DAY = 1000 * 60 * 60 * 24;


//function to find the difference between dates in number of days
// a and b are javascript Date objects
function dateDiffInDays(a, b) {
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.abs(Math.floor((utc2 - utc1) / _MS_PER_DAY));
}








function getStats() {
  let today = Math.floor(Date.now()/1000);
  // let sendDate = emailData[activeIndex].sendDate;
  let sendDate = overrideDateUTC_usable;
  let dateDiff = dateDiffInDays( new Date(Date.now()), new Date(sendDate * 1000) );


  //set max number of days to 6 weeks
  let numberDays = dateDiff <= 42 ? dateDiff : 42;
  drawArray = buildDateArray((sendDate * 1000), numberDays );


  //arrays to hold userIDs so each user can only watch a video once, one array for each watch type
  let userArrayWatches = [];
  let userArrayHalfs = [];





//use JavaScrip Set() to hold user_id # results. (sets only hold unique values, so no double counting anyone)
  const priorWatchesTotal = new Set();
  const priorWatchesHalf = new Set();
  const sinceWatchesTotal = new Set();
  const sinceWatchesHalf = new Set();




  function setPageView() {

    let tempDate = overrideEngDate.toUTCString().split(' ', 4).join(' ');;
    $("#email__date").html(tempDate);

    $(".length-of-time").html(numberDays);

     $("#prior-watches").html(priorWatchesTotal.size);
     $("#prior-half").html(priorWatchesHalf.size);

     $("#since-watches").html(sinceWatchesTotal.size);
     $("#since-half").html(sinceWatchesHalf.size);

  }



  //Read data from text file
  $.get("https://aycl.uie.com/?ACT=129&k=cbg8tj5bmv1bk3rc&a=watch&entry_id=" + overrideId, function(data) {
    let dataOBJ = JSON.parse(data);



     // loop through each individual line of stats
     for(let i = 0; i < dataOBJ.length-1; i++) {
       // let tempHolder = holder[i].split("\t");



       //if watch_type is "endat##" remove 'endat' and turn the remaining number-string into an int
       if(dataOBJ[i].watch_type.startsWith("endat")) {
         dataOBJ[i].watch_type = parseInt(dataOBJ[i].watch_type.replace("endat", ""));
       }

         //if the watchDate was BEFORE the SendDate AND the sendDate minus the watchDate is less than or equal to the difference between today and the sendDate
         if(( new Date(new Date(dataOBJ[i].date * 1000).toDateString()) <  new Date(new Date(sendDate * 1000).toDateString()) ) && ( dateDiffInDays( new Date(sendDate * 1000), new Date(dataOBJ[i].date * 1000) ) <= numberDays )) {
             if( (dataOBJ[i].watch_type === "half") || (dataOBJ[i].watch_type === "finished") || (dataOBJ[i].watch_type >= 50) ){
               priorWatchesHalf.add(dataOBJ[i].member_id);

               let halfIndex = userArrayHalfs.indexOf(dataOBJ[i].member_id);
                 if(halfIndex == -1) {
                   let liveIndex = drawArray.map(function(e) { return e.date; }).indexOf(new Date(dataOBJ[i].date * 1000).toDateString());
                   drawArray[liveIndex].halfTally += 1;
                   userArrayHalfs.push(dataOBJ[i].member_id);
                 }



             }
             if( dataOBJ[i].watch_type != "start" && dataOBJ[i].watch_type != "onwatch" &&  typeof(dataOBJ[i].watch_type) === "string"){
                 priorWatchesTotal.add(dataOBJ[i].member_id);


                 let watchesIndex = userArrayWatches.indexOf(dataOBJ[i].member_id);
                   if(watchesIndex == -1) {
                     let liveIndex = drawArray.map(function(e) { return e.date; }).indexOf(new Date(dataOBJ[i].date * 1000).toDateString());
                     drawArray[liveIndex].watchTally += 1;
                     userArrayWatches.push(dataOBJ[i].member_id);
                  }


               }
             else if (dataOBJ[i].watch_type > 0) {
               priorWatchesTotal.add(dataOBJ[i].member_id);
               let watchesIndex = userArrayWatches.indexOf(dataOBJ[i].member_id);
                 if(watchesIndex == -1) {
                   let liveIndex = drawArray.map(function(e) { return e.date; }).indexOf(new Date(dataOBJ[i].date * 1000).toDateString());
                   drawArray[liveIndex].watchTally += 1;
                   userArrayWatches.push(dataOBJ[i].member_id);
                }




             }

         }
         //if the watchDate was AFTER the SendDate AND the watchDate minus the sendDate is less than or equal to the difference between today and the sendDate
         else if( ( new Date(new Date(dataOBJ[i].date * 1000).toDateString()) >= new Date(new Date(sendDate * 1000).toDateString()) ) && (dateDiffInDays( new Date(dataOBJ[i].date * 1000), new Date(sendDate * 1000)) <= numberDays))   {

             if( (dataOBJ[i].watch_type === "half") || (dataOBJ[i].watch_type === "finished") || (dataOBJ[i].watch_type >= 50) ){
               sinceWatchesHalf.add(dataOBJ[i].member_id);

               let halfIndex = userArrayHalfs.indexOf(dataOBJ[i].member_id);
                 if(halfIndex == -1) {
                   let liveIndex = drawArray.map(function(e) { return e.date; }).indexOf(new Date(dataOBJ[i].date * 1000).toDateString());
                   drawArray[liveIndex].halfTally += 1;
                   userArrayHalfs.push(dataOBJ[i].member_id);
                 }


             }

             if( dataOBJ[i].watch_type != "start" && dataOBJ[i].watch_type != "onwatch" &&  typeof(dataOBJ[i].watch_type) === "string"){
                 sinceWatchesTotal.add(dataOBJ[i].member_id);

                 let watchesIndex = userArrayWatches.indexOf(dataOBJ[i].member_id);
                   if(watchesIndex == -1) {
                     let liveIndex = drawArray.map(function(e) { return e.date; }).indexOf(new Date(dataOBJ[i].date * 1000).toDateString());
                     drawArray[liveIndex].watchTally += 1;
                     userArrayWatches.push(dataOBJ[i].member_id);
                  }



             }
            else if (dataOBJ[i].watch_type > 0) {
              sinceWatchesTotal.add(dataOBJ[i].member_id);

              let watchesIndex = userArrayWatches.indexOf(dataOBJ[i].member_id);
                if(watchesIndex == -1) {
                  let liveIndex = drawArray.map(function(e) { return e.date; }).indexOf(new Date(dataOBJ[i].date * 1000).toDateString());
                  drawArray[liveIndex].watchTally += 1;
                  userArrayWatches.push(dataOBJ[i].member_id);
               }


            }

        } //end of after-send-date check
     }
    //end tallying for-loop






//remove current drawArray[0] which is a blank space holder/template entry
drawArray.shift();




     //Update numbers on the front end
     setPageView();

     //clear SVG for new drawing
     d3.select("#uniqueSVG").empty();

     //call d3 drawing function
    newDraw(sendDate);




   }, "text");







}

//find the index of the email being selected
function setActiveIndex(num) {
  d3.select("#uniqueSVG").empty();
  activeIndex = emailData.map(function(e) { return e.entry_id; }).indexOf(num);
  getStats();

}



//d3 draw SECTION
function newDraw(incdate) {
  d3.select("#uniqueSVG").selectAll("*").remove();
  var margin = {top: 40, right: 30, bottom: 50, left: 30},
      width = 800,
      height = 400;


  var x = d3.scaleTime()
      .range([0, width]);



  var y = d3.scaleLinear()
      .range([height, 0]);

  var xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%m/%d"));

  var yAxis = d3.axisLeft(y)
      .ticks(5);



  var svg = d3.select("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");





  x.domain([d3.min(drawArray, function(d) { return new Date(d.date); }), d3.max(drawArray, function(d) { return new Date(d.date); })]);
  y.domain([0, d3.max(drawArray, function(d) { return d.watchTally; })]);





  var toolIt = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "start");;
  // //
  svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(180)")
    .attr("y", -36)
    .attr("dy", ".71em")
    .style("text-anchor", "end");



  var bars = svg.selectAll(".bar")
    .data(drawArray).enter()
    .append("g")
    .attr("class","bar");


  if(watchesBool === true || bothBool === true) {

  var count1Bars = bars.append("rect")
      .attr("class", "watches1")
    .attr("x", function(d) {return x( new Date(type(d.date)) ) }  )
    .attr("shape-rendering", "auto")
    .attr( "width",  (width/drawArray.length + 10))
    .attr('y', function(d) { return y(d.watchTally); } )
    .attr('height', function(d,i){ return height - y(d.watchTally); })
    .attr("style", "outline: thin solid black;")
    .attr("fill", function(d) {
      if( new Date(type(d.date)).getMonth() === new Date(incdate * 1000).getMonth() ) {
          if( new Date(type(d.date)).getDate() >= new Date(incdate * 1000).getDate() ) {
            return "green";
          }
          else {
            return "lightblue";
          }
      }
      else if( new Date(type(d.date)).getMonth() > new Date(incdate * 1000).getMonth() ) {
        return "green";
      }
      else  {
        return "lightblue";
      }
    })
    .on("mouseover", function(d) {
       toolIt.transition()
         .duration(200)
         .style("opacity", .9);
       toolIt.html(d.date + "<br/>" + "Watches: " + d.watchTally + "<br/>" + "Days Before/After: " + dateDiffInDays( new Date(type(d.date)), new Date(incdate * 1000)) )
         .style("left", (d3.event.pageX) + "px")
         .style("top", (d3.event.pageY - 28) + "px");
       })
     .on("mouseout", function(d) {
       toolIt.transition()
         .duration(500)
         .style("opacity", 0);
       });

     }


       if (halfBool === true || bothBool === true) {

       var count2Bars = bars.append("rect")
           .attr("class", "halfwatches")
         .attr("x", function(d) {return x( new Date(type(d.date)) ) }  )
         .attr("shape-rendering", "auto")
         .attr( "width",  (width/drawArray.length))
         .attr('y', function(d) { return y(d.halfTally); } )
         .attr('height', function(d,i){ return height - y(d.halfTally); })
         .attr("style", "outline: 2px solid white;")
         .attr("fill", function(d) {
           if( new Date(type(d.date)).getMonth() === new Date(incdate * 1000).getMonth() ) {
               if( new Date(type(d.date)).getDate() >= new Date(incdate * 1000).getDate() ) {
                 return "rgba(0,125,0,.3)";
               }
               else {
                 return "steelblue";
               }
           }
           else if( new Date(type(d.date)).getMonth() > new Date(incdate * 1000).getMonth() ) {
             return "rgba(0,145,0,.3)";
           }
           else  {
             return "steelblue";
           }
         })
         .on("mouseover", function(d) {
            toolIt.transition()
              .duration(200)
              .style("opacity", .9);
            toolIt.html(d.date + "<br/>" + "OverHalfWatches: " + d.halfTally + "<br/>" + "Days Before/After: " + dateDiffInDays( new Date(type(d.date)), new Date(incdate * 1000)) )
              .style("left", (d3.event.pageX) + "px")
              .style("top", (d3.event.pageY - 28) + "px");
            })
          .on("mouseout", function(d) {
            toolIt.transition()
              .duration(500)
              .style("opacity", 0);
            });


          }






  function type(d) {
    d.date = +d.date;
    return d;
  }
}





});
