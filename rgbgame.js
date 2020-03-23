var num=6; 
var colors=generateRandomColor(num);
function randomcolor(){
		var random=Math.floor(Math.random()*colors.length)
		return colors[random];
	}
var square=document.querySelectorAll(".square");
var pickedcolor=randomcolor();
var display=document.querySelector("#colordisplay");
var message=document.querySelector("#message");
var h1=document.querySelector("h1");
var playagain=document.querySelector("#playagain");
var easy=document.querySelector("#easy");
var hard=document.querySelector("#hard");
display.textContent=pickedcolor;
for(var i=0; i<square.length; i++){
	square[i].style.backgroundColor=colors[i];
	square[i].addEventListener("click", function(){
	var clickedcolor=this.style.backgroundColor;
	if(clickedcolor==pickedcolor){
		message.textContent="correct";
		update(clickedcolor);
		playagain.textContent="Play Again!";
	}
	else{
		this.style.backgroundColor="#232323";
		message.textContent="Try Again";
		playagain.textContent="New Colors";
	}
	});
}
function update(color){
	for(var i=0; i<colors.length; i++)
	{
			square[i].style.backgroundColor=color;
			h1.style.backgroundColor=color;
	}
}
function generateRandomColor(num){
	var arr=[];
	for(var i=0; i<num; i++)
	{
		arr.push(randomColor());
	}
	return arr;
}
function randomColor(){
	var r=Math.floor(Math.random()*256);
	var g=Math.floor(Math.random()*256);
	var b=Math.floor(Math.random()*256);
	return "rgb("+r+", "+g+", "+b+")";
}
playagain.addEventListener("click", function(){
	colors=generateRandomColor(num);
	pickedcolor=randomcolor();
	display.textContent=pickedcolor;
	message.textContent="";
	playagain.textContent="New Colors"
	for(var i=0; i<square.length; i++)
	{
		square[i].style.backgroundColor=colors[i];
	}
	h1.style.backgroundColor="steelblue";

})
easy.addEventListener("click", function(){
	easy.classList.add("selected");
	hard.classList.remove("selected");
	num=3
	colors=generateRandomColor(num);
	pickedcolor=randomcolor();
	display.textContent=pickedcolor;
	for(var i=0; i<square.length; i++){
		if(i<3)
		{
			square[i].style.backgroundColor=colors[i];
		}
		else{
			square[i].style.display="none";
		}
	}
});
hard.addEventListener("click", function(){
	hard.classList.add("selected");
	easy.classList.remove("selected");
	num=6;
	colors=generateRandomColor(num);
	pickedcolor=randomcolor();
	display.textContent=pickedcolor;
	for(var i=0; i<square.length; i++){
		if(i<3)
		{
			square[i].style.backgroundColor=colors[i];
		}
		else{
			square[i].style.display="block";
		}
	}
});