/**
 * KSB048 V0.010
 */
//% weight=10 color=#00A6F0 icon="\uf085" block="KSB048"
namespace KSB048 {
    
    const SERVOMIN = 104 // this is the 'minimum' pulse length count (out of 4096)
    const SERVOMAX = 510 // this is the 'maximum' pulse length count (out of 4096)
    const IIC_ADDRESS = 0x40
    const MODE1 = 0x00
    const PRESCALE = 0xFE
    const LED0_ON_L = 0x06

    
    export enum ServoNum {
        S0 = 0,
        S1 = 1,
        S2 = 2,
        S3 = 3,
        S4 = 4,
        S5 = 5,
        S6 = 6,
        S7 = 7,
        S8 = 8,
        S9 = 9,
        S10 = 10,
        S11 = 11,
     }
     export enum MotorNum {
        //% blockId="M1A" block="M1A"
        M1A = 0,
        //% blockId="M1B" block="M1B"
        M1B = 1,
        //% blockId="M2A" block="M2A"
        M2A = 2,
        //% blockId="M2B" block="M2B"
        M2B = 3,

    }

   

    export enum FrqState {
        //% blockId="Frq_A" block="A"
        A = 0,
        //% blockId="Frq_B" block="B"
        B = 1,
        //% blockId="Frq_C" block="C"
        C = 2,
        //% blockId="Frq_D" block="D"
        D = 3,
        //% blockId="Frq_E" block="E"
        E = 4,
        //% blockId="Frq_F" block="F"
        F = 5,
     
    }

    

    let initialized = false;
    
	
    function i2c_write(reg: number, value: number) {
        
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(IIC_ADDRESS, buf)
    }

    function i2c_read(reg: number){
        
        pins.i2cWriteNumber(IIC_ADDRESS, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(IIC_ADDRESS, NumberFormat.UInt8BE);
        return val;
    }

    function init(): void {
        pins.setPull(DigitalPin.P8, PinPullMode.PullUp);
        pins.setPull(DigitalPin.P12, PinPullMode.PullUp);
        i2c_write(MODE1, 0x00);
        // Constrain the frequency
        setFreq(50);
        initialized = true;
    }

    function setFreq(freq: number): void {
        
        let prescaleval = 25000000/4096/freq;
        prescaleval -= 1;
        let prescale = prescaleval; 
        //let prescale = 121;
        let oldmode = i2c_read(MODE1);        
        let newmode = (oldmode & 0x7F) | 0x10; // sleep
        i2c_write(MODE1, newmode); // go to sleep
        i2c_write(PRESCALE, prescale); // set the prescaler
        i2c_write(MODE1, oldmode);
        control.waitMicros(5000);
        i2c_write(MODE1, oldmode | 0xa0);
	}
	
	function setPwm(channel: number, on: number, off: number): void {
		if (channel < 0 || channel > 15)
            return;

        let buf = pins.createBuffer(5);
        buf[0] = LED0_ON_L + 4 * channel;
        buf[1] = on & 0xff;
        buf[2] = (on>>8) & 0xff;
        buf[3] = off & 0xff;
        buf[4] = (off>>8) & 0xff;
        pins.i2cWriteBuffer(IIC_ADDRESS, buf);
	}	

	function servo_map(x: number, in_min: number, in_max: number, out_min: number, out_max: number)
    {
        return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }
    function motor_map(x: number)
    {
        x = x*16; // map 255 to 4096
		if(x > 4095){
			x= 4095;
		}
		if(x < -4095){
			x= -4095;
		}
        return x;
    }
    
    //% blockId=KSB048_Frq_Set
    //% block="PWM Frequency Set %frqval"
    //% weight=99
    export function Frq_Set(frqval:FrqState):void{
       
        if(!initialized){
            init()
        }
        if(frqval==FrqState.A){
            i2c_write(MODE1, 0x00);
            // Constrain the frequency
            setFreq(50*0.92);
    
        }else if(frqval==FrqState.B){
            i2c_write(MODE1, 0x00);
            // Constrain the frequency
            setFreq(50*0.94);
    
        }else if(frqval==FrqState.C){
            i2c_write(MODE1, 0x00);
            // Constrain the frequency
            setFreq(50*0.96);
                
        }else if(frqval==FrqState.D){
            i2c_write(MODE1, 0x00);
            // Constrain the frequency
            setFreq(50*0.98);
                
        }else if(frqval==FrqState.E){
            i2c_write(MODE1, 0x00);
            // Constrain the frequency
            setFreq(50*1);
                
        }else if(frqval==FrqState.F){
            i2c_write(MODE1, 0x00);
            // Constrain the frequency
            setFreq(50*1.02);
                
        }
    }
    

    //% blockId=KSB048_Ultrasonic 
    //% block="Ultrasonic(cm)"
    //% weight=98
    export function Ultrasonic(): number {

        let maxCmDistance = 500
        // send pulse
        pins.setPull(DigitalPin.P13, PinPullMode.PullNone);
        pins.digitalWritePin(DigitalPin.P13, 0);
        control.waitMicros(2);
        pins.digitalWritePin(DigitalPin.P13, 1);
        control.waitMicros(10);
        pins.digitalWritePin(DigitalPin.P13, 0);

        const d = pins.pulseIn(DigitalPin.P13, PulseValue.High, maxCmDistance * 58);
        // read pulse
        
        return Math.idiv(d, 58);
    }

 
    

    /**
     * Used to move the given servo to the specified degrees (0-180) connected to the KSB048
     * @param channel The number (1-16) of the servo to move
     * @param degrees The degrees (0-180) to move the servo to 
     */
    //% blockId=KSB048_Servo
    //% block="Servo channel %channel|degrees %degree"
    //% weight=86
    //% degree.min=0 degree.max=180
	export function Servo(channel: ServoNum, degree: number): void {
        
        if(!initialized){
			init()
		}
		// 50hz: 20,000 us
        //let servo_timing = (degree*1800/180+600) // 0.55 ~ 2.4
        //let pulselen = servo_timing*4096/20000
        //normal 0.5ms~2.4ms
        //SG90 0.5ms~2.0ms

        let pulselen = servo_map(degree, 0, 180, SERVOMIN, SERVOMAX);
        //let pulselen = servo_map(degree, 0, 180, servomin, servomax);
        setPwm(channel, 0, pulselen);
  
    }
    
	/**
     * Used to move the given servo to the specified degrees (0-180) connected to the KSB048
     * @param channel The number (1-16) of the servo to move
     * @param degrees The degrees (0-180) to move the servo to
     * @param servomin 'minimum' pulse length count ; eg: 112
     * @param servomax 'maximum' pulse length count ; eg: 491
     */
    //% blockId=KSB048_ServoRange
    //% block="Servo channel %channel|degrees %degree|servomin %servomin|servomax %servomax"
    //% degree.min=0 degree.max=180
	export function ServoRange(channel: ServoNum, degree: number, servomin: number, servomax: number): void {
        
        if(!initialized){
			init()
		}
		// 50hz: 20,000 us
        //normal 0.5ms~2.4ms
        //SG90 0.5ms~2.0ms
        // servomin Servo_min_timing (ms)*1000*4096/20000 
        // servomax Servo_max_timing (ms)*1000*4096/20000 
        // let pulselen = servo_map(degree, 0, 180, SERVOMIN, SERVOMAX);
        let pulselen = servo_map(degree, 0, 180, servomin, servomax);
        setPwm(channel, 0, pulselen);

    }

    //% blockId=KSB048_Motor 
    //% block="Motor channel %channel|speed %speed"
	//% weight=85
	//% speed.min=-255 speed.max=255
    export function Motor(channel: MotorNum, speed: number): void {
		if(!initialized){
			init()
        }
        let pwm1 =0;
        let pwm2 =0;
        speed=motor_map(speed);

        switch(channel){

            case 0:{
                pwm1 = 11;
                pwm2 = 10;                
                break;
            }
            case 1:{
                pwm1 = 8;
                pwm2 = 9;                
                break;
            }
            case 2:{
                pwm1 = 12;
                pwm2 = 13;               
                break;
            }
            case 3:{
                pwm1 = 15;
                pwm2 = 14;              
                break;
            }
            
        }
        

		if(speed>=0){
			setPwm(pwm1, 0, speed)
			setPwm(pwm2, 0, 0)
		}else{
			setPwm(pwm1, 0, 0)
			setPwm(pwm2, 0, -speed)
        }
            
    }
    //% blockId=PWM_DETECT_Frequency
    //% block="DETECT Servo %channel Frequency to pin %iopin"
    //% weight=80
    export function DETECT_Frequency(channel: ServoNum, iopin: DigitalPin): number  {
        let frq = 0;
        let frqPinState = 0;
        let prevFrqPinState = 0;
        let oneSecond = 1000;
        let timer = 0;
        let ret_frq = 0;
       
        if(!initialized){
			init()
        }
        setPwm(channel, 0, SERVOMAX);
        for(let i=0; i<2000 ; i++) {
            frqPinState = pins.digitalReadPin(iopin)
            if (frqPinState == 0) {
                prevFrqPinState = 0
            }
            if (frqPinState == 1 && prevFrqPinState == 0) {
                prevFrqPinState = frqPinState
                frq = frq + 1
            }
            control.waitMicros(1000)
            timer = timer + 1
            if (timer > oneSecond) {
                frq = frq-2
                if (frq > 53) {
                    //basic.showString("A")
                    ret_frq= 65
                } else {
                    if (frq > 52) {
                        //basic.showString("B")
                        ret_frq= 66
                    } else {
                        if (frq > 51) {
                            //basic.showString("C")
                            ret_frq= 67
                        } else {
                            if (frq > 50) {
                                //basic.showString("D")
                                ret_frq=  68
                            } else {
                                if (frq > 49) {
                                    //basic.showString("E")
                                    ret_frq=  69
                                } else {
                                    if (frq > 48) {
                                        //basic.showString("F")
                                        ret_frq=  70
                                    } else {
                                        if(frq <= 48) {
                                            //basic.showString("X")
                                            ret_frq=  88

                                        }
                                    }
                                        
                                }
                            }
                        }
                    }
                }

                frq = 0
                timer = 0
            }
        }
        return ret_frq
        

    }
	
	


}
