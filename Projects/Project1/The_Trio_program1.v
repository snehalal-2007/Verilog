//===========================================
//
// Project 1
// Cohort Name: The Trio
// Team: Sneha, Kriti, Pratik
// Date: September 25, 2026
// Fall 2026
//
// -----------------------------------------
//
// Software - iVerilog
// Editor - VS code
// 
//
//===========================================

// Breadboard

module Breadboard	(w,x,y,z,r0,r1,r2,r3,r4,r5,r6,r7,r8,r9);  //Module Header/Module Begin
input w,x,y,z;                                                //Inputs
output r0,r1,r2,r3,r4,r5,r6,r7,r8,r9;                         //Outputs
wire w,x,y,z;							        //Input
reg r0,r1,r2,r3,r4,r5,r6,r7,r8,r9;              //Output

always @ ( w,x,y,z,r0,r1,r2,r3,r4,r5,r6,r7,r8,r9) begin       
                                         

	//The Formula F0
	r0 = ((~w)&(~x)&(~y)&(~z)) | ((~w)&(~x)&(~y)&(z)) | ((~w)&(~x)&(y)&(z)) | ((~w)&(x)&(y)&(z)) | ((w)&(x)&(~y)&(~z)) | ((w)&(x)&(y)&(z));

	//The Formula F1
	r1 = (~w&~x&~y&~z) | (~w&~x&~y&z) | (~w&x&y&~z) | (~w&x&y&z) | (w&~x&~y&~z) | (w&~x&y&~z) | (w&x&~y&z);

	//The Formula F2
    r2 = (~w&~x&~y&~z) | (~w&~x&~y&z) | (~w&~x&y&~z) | (~w&x&y&~z) | (w&~x&~y&~z) | (w&~x&y&~z) | (w&~x&y&z) | (w&x&~y&z) | (w&x&y&~z) | (w&x&y&z);

    //The Formula F3
    r3 = ((~w)&(~x)&(~y)&(~z)) | ((~w)&(~x)&(~y)&(z)) | ((~w)&(x)&(y)&(z)) | ((w)&(~x)&(y)&(~z)) | ((w)&(x)&(y)&(z));

	//The Formula F4
    r4 = (~w&~x&~y&~z)|(~w&~x&y&~z)|(~w&x&~y&~z)|(~w&x&~y&z) | (~w&x&y&z) | (w&~x&~y&z) | (w&~x&y&~z) | (w&x&~y&~z) | (w&x&~y&z) | (w&x&y&~z);

    //The Formula F5
	r5 = (~w&~x&~y&~z) | (~w&~x&y&z) | (~w&x&~y&~z) | (~w&x&~y&z) | (~w&x&y&~z) | (~w&x&y&z) | (w&~x&y&~z) | (w&~x&y&z) | (w&x&~y&~z) | (w&x&~y&z) | (w&x&y&z);

	//The Formula F6
    r6 = (~w&~x&~y&~z) | (~w&~x&y&z) | (~w&x&~y&z) | (~w&x&y&~z) | (w&~x&~y&z) | (w&~x&y&~z) | (w&x&~y&~z) | (w&x&~y&z) | (w&x&y&~z);

    //The Formula F7
	r7 = (~w&~x&~y&z) | (~w&x&~y&z) | (w&~x&y&~z) | (w&x&y&~z) | (w&x&y&z);

	//The Formula F8
    r8 = (~w&~x&~y&z)|(~w&~x&y&~z)|(~w&x&~y&~z)|(w&~x&~y&z) | (w&~x&y&~z) | (w&~x&y&~z) | (w&~x&y&z) | (w&x&~y&~z) | (w&x&~y&z) | (w&x&y&~z);

    //The Formula F9
	r9 = (~w&~x&~y&z) | (~w&~x&y&~z) | (~w&x&~y&z) | (~w&x&y&~z) | (w&~x&y&z) | (w&x&~y&z) | (w&x&y&~z) | (w&x&y&z) ;

    end                                  
    // Finish the Always block

endmodule                                
//Module End

//-------------------------------------------
//
// Testbench module
// 
// Generate four inputs for a truth table (w,x,y,z)
// 
// Use a for loop to generate each line of the truth table.
// 
// Goals:
// Have example of the wire/reg parameter passing
// Print right values for functions from f0 to f9.
//
//-------------------------------------------
module testbench();

	//Registers act like local variables
	reg [4:0] i; //A loop control for 16 rows of a truth table.
	reg  a;     //Value of 2^3
	reg  b;     //Value of 2^2
	reg  c;     //Value of 2^1
	reg  d;     //Value of 2^0
  
	//A wire can hold the return of a function
	wire  f0,f1,f2,f3,f4,f5,f6,f7,f8,f9;
  
	//breadboard
	Breadboard bb8(a,b,c,d,f0,f1,f2,f3,f4,f5,f6,f7,f8,f9);
 	 
	//start block for the code	
	initial begin
   	
		//printing the table.
		$display ("|##|W|X|Y|Z|F0|F1|F2|F3|F4|F5|F6|F7|F8|F9|");
		$display ("|==+=+=+=+=+==+==+==+==+==+==+==+==+==+==|");
  
		//for loop to display the values
		for (i = 0; i <16; i = i + 1) 
		begin										//Open the code block of the for loop
			a=(i/8);//High bit
			b=(i/4);
			c=(i/2);
			d=(i/1);//Low bit	
		 
            #10;

			//Display one row of the truth table
			$display ("|%2d|%1d|%1d|%1d|%1d| %1d| %1d| %1d| %1d| %1d| %1d| %1d| %1d| %1d| %1d|",i,a,b,c,d,f0,f1,f2,f3,f4,f5,f6,f7,f8,f9);
			
			//Every fourth row of the table, put in a marker for easier reading.
			if(i%4==3) 
			begin 									
				$write ("|--+-+-+-+-+--+--+--+--+--+--+--+--+--+--|\n");	
			end 									

		end											
        //End of the for loop code block
 
		//A time delay of 10 time units. Hashtag Delay
		#10; 
		
		//The finish command.
		$finish;
		
	end  
    //End the code block of the main thread (initial)
  
endmodule 
//Close the testbench module