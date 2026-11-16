`timescale 1ns/1ps

// ==========================================
// Project 3 - Sequential Logic Circuit
// Cohort: The Trio
// Team: Sneha, Kriti, Pratik
// Fall 2026
// ==========================================

// IDE: VS Code
// Code: iVerilog

// ==========================================
// MODULE 1: D Flip-Flop
// ==========================================

module DFF(
    input clk,
    input in,
    output reg out
);

    always @(posedge clk)
        out <= in;

endmodule


// ==========================================
// MODULE 2: Breadboard
// ==========================================

module Breadboard(
    input clk,
    input reset,
    input [1:0] T,
    output [1:0] state,
    output [2:0] Out
);

    wire CS1_out, CS0_out;
    wire NS1, NS0;
    reg D1, D0;

    // Calculate next state
    assign NS1 = CS1_out ^ T[1] ^ (CS0_out & T[0]);
    assign NS0 = CS0_out ^ T[0];

    // Reset or update next state
    always @(*) begin
        if (reset == 1) begin
            D1 = 0;
            D0 = 0;
        end
        else begin
            D1 = NS1;
            D0 = NS0;
        end
    end

    // Connect D flip-flops
    DFF CS1 (clk, D1, CS1_out);
    DFF CS0 (clk, D0, CS0_out);

    // Calculate outputs
    assign Out[2] = ~CS1_out & CS0_out;
    assign Out[1] = CS1_out & ~CS0_out;
    assign Out[0] = CS1_out & CS0_out;

    // Connect current state
    assign state = {CS1_out, CS0_out};

endmodule


// ==========================================
// MODULE 3: Testbench
// ==========================================

module testbench;

    reg clk, reset;
    reg [1:0] T;

    wire [1:0] state;
    wire [2:0] Out;

    reg [1:0] old_state, old_T;
    reg [2:0] old_Out;

    // Connect breadboard
    Breadboard bb(clk, reset, T, state, Out);


    // Generate clock
    initial begin
        clk = 0;
        forever #5 clk = ~clk;
    end


    // Print state transitions
    initial begin
        forever begin
            @(posedge clk);

            if (reset == 0) begin
                old_state = state;
                old_T = T;
                old_Out = Out;

                #1;

                $display("%02b==%02b/%03b==>%02b",
                         old_state, old_T, old_Out, state);
            end
        end
    end


    // Reset machine
    task reset_machine;
        begin
            @(negedge clk);
            reset = 1;

            @(posedge clk);
            #1 reset = 0;
        end
    endtask


    // Apply trigger
    task trigger;
        input [1:0] value;
        begin
            @(negedge clk);
            T = value;

            @(posedge clk);
            #2;
        end
    endtask


    // Main testing
    initial begin

        reset = 1;
        T = 2'b00;

        @(posedge clk);
        #1 reset = 0;


        // ----------------------------------
        // PHASE 1: Testing Transitions
        // ----------------------------------

        $display("");
        $display("PHASE 1 TESTING TRANSITIONS");


        // Starting State 00
        $display("");
        $display("Testing from state 00");

        $display("");
        $display("Case 0");
        reset_machine;
        trigger(2'b00);

        $display("");
        $display("Case 1");
        reset_machine;
        trigger(2'b01);

        $display("");
        $display("Case 2");
        reset_machine;
        trigger(2'b10);

        $display("");
        $display("Case 3");
        reset_machine;
        trigger(2'b11);


        // Starting State 01
        $display("");
        $display("Testing from state 01");

        $display("");
        $display("Case 4");
        reset_machine;
        trigger(2'b01);
        trigger(2'b00);

        $display("");
        $display("Case 5");
        reset_machine;
        trigger(2'b01);
        trigger(2'b01);

        $display("");
        $display("Case 6");
        reset_machine;
        trigger(2'b01);
        trigger(2'b10);

        $display("");
        $display("Case 7");
        reset_machine;
        trigger(2'b01);
        trigger(2'b11);


        // Starting State 10
        $display("");
        $display("Testing from state 10");

        $display("");
        $display("Case 8");
        reset_machine;
        trigger(2'b10);
        trigger(2'b00);

        $display("");
        $display("Case 9");
        reset_machine;
        trigger(2'b10);
        trigger(2'b01);

        $display("");
        $display("Case 10");
        reset_machine;
        trigger(2'b10);
        trigger(2'b10);

        $display("");
        $display("Case 11");
        reset_machine;
        trigger(2'b10);
        trigger(2'b11);


        // Starting State 11
        $display("");
        $display("Testing from state 11");

        $display("");
        $display("Case 12");
        reset_machine;
        trigger(2'b11);
        trigger(2'b00);

        $display("");
        $display("Case 13");
        reset_machine;
        trigger(2'b11);
        trigger(2'b01);

        $display("");
        $display("Case 14");
        reset_machine;
        trigger(2'b11);
        trigger(2'b10);

        $display("");
        $display("Case 15");
        reset_machine;
        trigger(2'b11);
        trigger(2'b11);


        // ----------------------------------
        // PHASE 2: Testing Path
        // ----------------------------------

        $display("");
        $display("PHASE 2 TESTING PATH");

        reset_machine;

        trigger(2'b00);
        trigger(2'b01);
        trigger(2'b00);
        trigger(2'b01);
        trigger(2'b00);
        trigger(2'b01);
        trigger(2'b00);
        trigger(2'b01);

        @(negedge clk);
        $finish;

    end

endmodule
