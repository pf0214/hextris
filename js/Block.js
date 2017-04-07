function Block(fallingLane, color, iter, distFromHex, settled) {
// 判断色块是否已到达底部，到达中心位置或者落在其他色块之上
	this.settled = (settled === undefined) ? 0 : 1;
	this.height = settings.blockHeight;
// 当前色块所处的通道（六边形中第几个边坠落）,初始坠落通道
	this.fallingLane = fallingLane;

	this.checked=0;
// 根据当前所处通道，算出当前色块的角度
	this.angle = 90 - (30 + 60 * fallingLane);
	//for calculating the rotation of blocks attached to the center hex
	this.angularVelocity = 0;
	this.targetAngle = this.angle;//目标坠落区域
	this.color = color;
	// 于周围色块比较，判断当前色块是否消失
	this.deleted = 0;
	//blocks slated to be removed from falling and added to the hex
	// 判断当前色块是移除还是添加到其他色块或中心点上
	this.removed = 0;
	//value for the opacity of the white blcok drawn over falling block to give it the glow as it attaches to the hex
	this.tint = 0;
	// 用于删除时的动画
	this.opacity = 1;
	//boolean for when the block is expanding
	this.initializing = 1;
	this.ict = MainHex.ct;
// 当前色块坠落的速度
	this.iter = iter;
	//number of iterations before starting to drop
	// 开始坠落前的重复次数
	this.initLen = settings.creationDt;
	//side which block is attached too
	// 最终落下时添加到哪一个通道上
	this.attachedLane = 0;
	// 距离中心区域的距离，用来进行相应的缩放和判断是否与其他的色块相碰撞
	this.distFromHex = distFromHex || settings.startDist * settings.scale ;

	this.incrementOpacity = function() {
		if (this.deleted) {
			//add shakes
			if (this.opacity >= 0.925) {
				var tLane = this.attachedLane - MainHex.position;
				tLane = MainHex.sides - tLane;
				while (tLane < 0) {
					tLane += MainHex.sides;
				}

				tLane %= MainHex.sides;
				MainHex.shakes.push({lane:tLane, magnitude:3 * (window.devicePixelRatio ? window.devicePixelRatio : 1) * (settings.scale)});
			}
			//fade out the opacity
			this.opacity = this.opacity - 0.075 * MainHex.dt;
			if (this.opacity <= 0) {
				//slate for final deletion
				this.opacity = 0;
				this.deleted = 2;
				if (gameState == 1 || gameState==0) {
					localStorage.setItem("saveState", exportSaveState());
				}
			}
		}
	};

	this.getIndex = function (){
		//get the index of the block in its stack
		var parentArr = MainHex.blocks[this.attachedLane];
		for (var i = 0; i < parentArr.length; i++) {
			if (parentArr[i] == this) {
				return i;
			}
		}
	};

	this.draw = function(attached, index) {
		this.height = settings.blockHeight;
		if (Math.abs(settings.scale - settings.prevScale) > 0.000000001) {
			this.distFromHex *= (settings.scale/settings.prevScale);
		}

		this.incrementOpacity();
		if(attached === undefined)
			attached = false;

		if(this.angle > this.targetAngle) {
			this.angularVelocity -= angularVelocityConst * MainHex.dt;
		}
		else if(this.angle < this.targetAngle) {
			this.angularVelocity += angularVelocityConst * MainHex.dt;
		}

		if (Math.abs(this.angle - this.targetAngle + this.angularVelocity) <= Math.abs(this.angularVelocity)) { //do better soon
			this.angle = this.targetAngle;
			this.angularVelocity = 0;
		}
		else {
			this.angle += this.angularVelocity;
		}

		this.width = 2 * this.distFromHex / Math.sqrt(3);
		this.widthWide = 2 * (this.distFromHex + this.height) / Math.sqrt(3);
		//this.widthWide = this.width + this.height + 3;
		var p1;
		var p2;
		var p3;
		var p4;
		if (this.initializing) {
			var rat = ((MainHex.ct - this.ict)/this.initLen);
			if (rat > 1) {
				rat = 1;
			}
			p1 = rotatePoint((-this.width / 2) * rat, this.height / 2, this.angle);
			p2 = rotatePoint((this.width / 2) * rat, this.height / 2, this.angle);
			p3 = rotatePoint((this.widthWide / 2) * rat, -this.height / 2, this.angle);
			p4 = rotatePoint((-this.widthWide / 2) * rat, -this.height / 2, this.angle);
			if ((MainHex.ct - this.ict) >= this.initLen) {
				this.initializing = 0;
			}
		} else {
			p1 = rotatePoint(-this.width / 2, this.height / 2, this.angle);
			p2 = rotatePoint(this.width / 2, this.height / 2, this.angle);
			p3 = rotatePoint(this.widthWide / 2, -this.height / 2, this.angle);
			p4 = rotatePoint(-this.widthWide / 2, -this.height / 2, this.angle);
		}

		if (this.deleted) {
			ctx.fillStyle = "#FFF";// 消除后填充白色
		} else if (gameState === 0) {
			if (this.color.charAt(0) == 'r') {
				ctx.fillStyle = rgbColorsToTintedColors[this.color];
			}
			else {
				ctx.fillStyle = hexColorsToTintedColors[this.color];
			}
		}
		else {
			ctx.fillStyle = this.color;
		}

		ctx.globalAlpha = this.opacity;
		var baseX = trueCanvas.width / 2 + Math.sin((this.angle) * (Math.PI / 180)) * (this.distFromHex + this.height / 2) + gdx;
		var baseY = trueCanvas.height / 2 - Math.cos((this.angle) * (Math.PI / 180)) * (this.distFromHex + this.height / 2) + gdy;
		ctx.beginPath();
		ctx.moveTo(baseX + p1.x, baseY + p1.y);
		ctx.lineTo(baseX + p2.x, baseY + p2.y);
		ctx.lineTo(baseX + p3.x, baseY + p3.y);
		ctx.lineTo(baseX + p4.x, baseY + p4.y);
		//ctx.lineTo(baseX + p1.x, baseY + p1.y);
		ctx.closePath();
		ctx.fill();

		if (this.tint) {
			if (this.opacity < 1) {
				if (gameState == 1 || gameState==0) {
					localStorage.setItem("saveState", exportSaveState());
				}

				this.iter = 2.25;
				this.tint = 0;
			}

			ctx.fillStyle = "#FFF";
			ctx.globalAlpha = this.tint;
			ctx.beginPath();
			ctx.moveTo(baseX + p1.x, baseY + p1.y);
			ctx.lineTo(baseX + p2.x, baseY + p2.y);
			ctx.lineTo(baseX + p3.x, baseY + p3.y);
			ctx.lineTo(baseX + p4.x, baseY + p4.y);
			ctx.lineTo(baseX + p1.x, baseY + p1.y);
			ctx.closePath();
			ctx.fill();
			this.tint -= 0.02 * MainHex.dt;
			if (this.tint < 0) {
				this.tint = 0;
			}
		}

		ctx.globalAlpha = 1;
	};
}

function findCenterOfBlocks(arr) {
	var avgDFH = 0;
	var avgAngle = 0;
	for (var i = 0; i < arr.length; i++) {
		avgDFH += arr[i].distFromHex;
		var ang = arr[i].angle;
		while (ang < 0) {
			ang += 360;
		}

		avgAngle += ang % 360;
	}

	avgDFH /= arr.length;
	avgAngle /= arr.length;

	return {
		x:trueCanvas.width/2 + Math.cos(avgAngle * (Math.PI / 180)) * avgDFH,
		y:trueCanvas.height/2 + Math.sin(avgAngle * (Math.PI / 180)) * avgDFH
	};
}
