//===========================================
//
// Luna - Stargazing Park
// Author: Sneha
// Fall 2026
//
// -----------------------------------------
//
// Software - iVerilog
// Editor - VS code
//
// This project decides when to stargaze
//
//===========================================

// Breadboard

module Breadboard	(sunset,a,b,c,d,ready);    //Module Header/Module Begin
input sunset,a,b,c,d;                          //Inputs: sunset + the four lamps: fountain, trail, playground, stargazing (1 = lit, 0 = dark)
output ready;                                  //Output: 1 = time to stargaze
wire sunset,a,b,c,d;                           //Input
reg ready;                                     //Output

always @ (sunset,a,b,c,d) begin

	//The Formula: sunset & a'b'c'd'
	ready = (sunset) & (~a) & (~b) & (~c) & (~d);  //sunset is needed: in the day a,b,c,d are all 0 too

    end
    // Finish the Always block

endmodule
//Module End

//-------------------------------------------
//
// Testbench module
//
// Two ways to run it:
//   vvp simulation                              -> prints the whole truth table
//   vvp simulation +SUNSET=1 +A=0 +B=0 +C=0 +D=0 -> prints one RESULT line (what app.py uses)
//
//-------------------------------------------
module testbench();

	//Registers act like local variables
	reg [5:0] i;    //A loop control for 32 rows of a truth table.
	reg  s;         //sunset      Value of 2^4
	reg  a;         //fountain    Value of 2^3
	reg  b;         //trail       Value of 2^2
	reg  c;         //playground  Value of 2^1
	reg  d;         //stargazing  Value of 2^0
	integer value;  //holds one number read from the command line

	//A wire can hold the return of a function
	wire  ready;

	//breadboard
	Breadboard bb(s,a,b,c,d,ready);

	//start block for the code
	initial begin

		if ($value$plusargs("SUNSET=%d", value)) begin          //app.py sent the park's state
			s = value;
			if (!$value$plusargs("A=%d", value)) value = 0; a = value;  //missing switch counts as 0
			if (!$value$plusargs("B=%d", value)) value = 0; b = value;
			if (!$value$plusargs("C=%d", value)) value = 0; c = value;
			if (!$value$plusargs("D=%d", value)) value = 0; d = value;

			#10;                                                  //let the breadboard settle

			$display ("RESULT SUNSET=%1d A=%1d B=%1d C=%1d D=%1d READY=%1d",s,a,b,c,d,ready);  //app.py reads this line
		end
		else begin                                                //run by hand: print the truth table

			//printing the table.
			$display ("|##|S|A|B|C|D|READY|");
			$display ("|==+=+=+=+=+=+=====|");

			//for loop to display the values
			for (i = 0; i < 32; i = i + 1)
			begin									//Open the code block of the for loop
				s=(i/16);//High bit
				a=(i/8);
				b=(i/4);
				c=(i/2);
				d=(i/1);//Low bit

				#10;

				//Display one row of the truth table
				$display ("|%2d|%1d|%1d|%1d|%1d|%1d|  %1d  |",i,s,a,b,c,d,ready);

				//Every fourth row of the table, put in a marker for easier reading.
				if(i%4==3)
				begin
					$write ("|--+-+-+-+-+-+-----|\n");
				end

			end
			//End of the for loop code block
		end

		//A time delay of 10 time units. Hashtag Delay
		#10;

		//The finish command.
		$finish;

	end
	//End the code block of the main thread (initial)

endmodule
//Close the testbench module
