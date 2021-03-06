
function Parser(){
  this.time;
  this.timebase;
  this.buffer;
  this.data;
  this.FMT=[];
  this.FMT[128]={'Type':'128','length':'89','Name':'FMT','Format':'BBnNZ','Columns':'Type,Length,Name,Format,Columns'};
  this.offset=0;
  this.msgType=[];
  this.offsetArray=[];
}
Parser.prototype.FORMAT_TO_STRUCT = function(obj)
{
    var temp;
    var dict={};
    var column=assign_column(obj.Columns);
    for (var i = 0; i < obj.Format.length; i++) {
        temp=obj.Format.charAt(i);
        switch(temp){
            case 'b':
                dict[column[i]]=this.data.getInt8(this.offset);
                this.offset+=1;
                break;
            case 'B':
                dict[column[i]]=this.data.getUint8(this.offset);
                this.offset+=1;
                break;
            case 'h':
                dict[column[i]]=this.data.getInt16(this.offset,true);
                this.offset+=2;
                break;
            case 'H':
                dict[column[i]]=this.data.getUint16(this.offset,true);
                this.offset+=2;
                break;
            case 'i':
                dict[column[i]]=this.data.getInt32(this.offset,true);
                this.offset+=4;
                break;
            case 'I':
                dict[column[i]]=this.data.getUint32(this.offset,true);
                this.offset+=4;
                break;
            case 'f':
                dict[column[i]]=this.data.getFloat32(this.offset,true);
                this.offset+=4;
                break;
            case 'd':
                dict[column[i]]=this.data.getFloat64(this.offset,true);
                this.offset+=8;
                break;
            case 'Q':
                var low = this.data.getUint32(this.offset,true);
                this.offset+=4;
                var n = this.data.getUint32(this.offset,true) * 4294967296.0 + low;
                if (low < 0) n += 4294967296;
                dict[column[i]]=n;
                this.offset+=4;
                break;
            case 'q':
                var low = this.data.getInt32(this.offset,true);
                this.offset+=4;
                var n = this.data.getInt32(this.offset,true) * 4294967296.0 + low;
                if (low < 0) n += 4294967296;
                dict[column[i]]=n;
                this.offset+=4;
                break;
            case 'n':
                dict[column[i]]=String.fromCharCode.apply(null, new Uint8Array(this.buffer,this.offset,4)).replace(/\x00+$/g, '');
                this.offset+=4;
                break;
            case 'N':
                dict[column[i]]=String.fromCharCode.apply(null, new Uint8Array(this.buffer,this.offset,16)).replace(/\x00+$/g, '');
                this.offset+=16;
                break;
            case 'Z':
                dict[column[i]]=String.fromCharCode.apply(null, new Uint8Array(this.buffer,this.offset,64)).replace(/\x00+$/g, '');
                this.offset+=64;
                break;
            case 'c':
                //this.this.data.setInt16(offset,true);
                dict[column[i]]=this.data.getInt16(this.offset,true)*100;
                this.offset+=2;
                break;
            case 'C':
                //this.data.setUint16(offset,true);
                dict[column[i]]=this.data.getUint16(this.offset,true)*100;
                this.offset+=2;
                break;
            case 'E':
                //this.data.setUint32(offset,true);
                dict[column[i]]=this.data.getUint32(this.offset,true)*100;
                this.offset+=4;
                break;
            case 'e':
                //this.data.setInt32(offset,true);
                dict[column[i]]=this.data.getInt32(this.offset,true)*100;
                this.offset+=4;
                break;
            case 'L':
                //this.data.setInt32(offset,true);
                dict[column[i]]=this.data.getInt32(this.offset,true);
                this.offset+=4;
                break;
            case 'M':
                //this.data.setInt32(offset,true);
                dict[column[i]]=this.data.getUint8(this.offset);
                this.offset+=1;
                break;
        }
    }
    return dict;
}

Parser.prototype.gpstimetoTime=function(week,msec)
{
  epoch = 86400*(10*365 + (1980-1969)/4 + 1 + 6 - 2);
  return epoch + 86400*7*week + msec*0.001 - 15;

}

Parser.prototype.setTimeBase=function(base)
{
  this.timebase=base;
}

Parser.prototype.findTimeBase=function(gps)
{
  var temp= this.gpstimetoTime(parseInt(gps['GWk']),parseInt(gps['GMS']));
  this.setTimeBase(parseInt(temp-gps['TimeUS']*0.000001));

}

Parser.prototype.getMsgType=function(element){
  for(i=0;i<this.FMT.length;i++)
  {
    if(this.FMT[i]!=null)
    {
      if(this.FMT[i].Name==element){
        return i;
      }
    }
  }
}

Parser.prototype.parse_atOffset=function(type,name){
  type=this.getMsgType(type);
  var parsed=[];
  var num=0;
    for(var i=0;i<this.msgType.length;i++)
    {
      if(type==this.msgType[i]){
            this.offset = this.offsetArray[i];
            var temp=this.FORMAT_TO_STRUCT(this.FMT[this.msgType[i]]);
            if(name=="TimeUS" && temp[name]!=null){
              parsed.push(this.time_stamp(temp[name]));
            }
            else if (temp[name]!=null){
            parsed.push(temp[name]);
          }
        }
    }
    return parsed;
}

Parser.prototype.time_stamp=function (TimeUs){
  var temp=0;
  temp=this.timebase+TimeUs*0.000001;
  if(temp>0)
    TimeUs= temp;
    var date = new Date(TimeUs*1000);
    var day=date.getDate();
    var month=date.getMonth();
    var year=date.getFullYear();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    var date=date.toString();
    var time=date.split(" ");
    if(time[0]!=="Invalid"){
      this.time=time[0] + " "+time[1] + " "+time[2] + " "+time[3];
    }
    return formattedTime;
}

function assign_column(obj){
    var ArrayOfString=obj.split(',');
    return ArrayOfString;
}
Parser.prototype.DF_reader=function()
{
    while(this.offset<(this.buffer.byteLength-20)) {
        this.offset += 2;
        var attribute = this.data.getUint8(this.offset);
        if(this.FMT[attribute]!=null) {
                this.offset += 1;
                this.offsetArray.push(this.offset);
                this.msgType.push(attribute);
                var value = this.FORMAT_TO_STRUCT(this.FMT[attribute]);
                if(this.FMT[attribute].Name=='GPS'){
                  this.findTimeBase(value);
                }
                if (attribute == '128') {
                    this.FMT[value['Type']] = {
                        'Type': value['Type'],
                        'length': value['Length'],
                        'Name': value['Name'],
                        'Format': value['Format'],
                        'Columns': value['Columns']
                    };
                }
        }
        else{
          this.offset+=1;
        }
}
}
