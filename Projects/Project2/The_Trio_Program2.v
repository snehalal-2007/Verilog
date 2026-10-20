// ==========================================
// Project 2 - Seven Segment Display
// Cohort: The Trio
// Team: Sneha, Kriti, Pratik
// Fall 2026
// ==========================================

// IDE: VS Code
// Code: iVerilog

// ==========================================
// MODULE 1: 4-to-16 Decoder
// ==========================================

module Decoder4to16(
    input [3:0] num,
    output [15:0] D
);

    wire n3, n2, n1, n0;

    not (n3, num[3]);
    not (n2, num[2]);
    not (n1, num[1]);
    not (n0, num[0]);

    // Generate all 16 one-hot outputs
    and (D[0],  n3, n2, n1, n0);
    and (D[1],  n3, n2, n1, num[0]);
    and (D[2],  n3, n2, num[1], n0);
    and (D[3],  n3, n2, num[1], num[0]);

    and (D[4],  n3, num[2], n1, n0);
    and (D[5],  n3, num[2], n1, num[0]);
    and (D[6],  n3, num[2], num[1], n0);
    and (D[7],  n3, num[2], num[1], num[0]);

    and (D[8],  num[3], n2, n1, n0);
    and (D[9],  num[3], n2, n1, num[0]);
    and (D[10], num[3], n2, num[1], n0);
    and (D[11], num[3], n2, num[1], num[0]);

    and (D[12], num[3], num[2], n1, n0);
    and (D[13], num[3], num[2], n1, num[0]);
    and (D[14], num[3], num[2], num[1], n0);
    and (D[15], num[3], num[2], num[1], num[0]);

endmodule


// ==========================================
// MODULE 2: Breadboard
// ==========================================

module Breadboard(input [3:0] num);

    wire [15:0] D;
    wire a, b, c, d, e, f, g;

    // Connect decoder
    Decoder4to16 decoder(num, D);

    // Segment A
    assign a = D[0] | D[2] | D[3] | D[5] | D[6] | D[7] | D[8] | D[9] | D[10] | D[14] | D[15];

    // Segment B
    assign b = D[0] | D[1] | D[2] | D[3] | D[4] | D[7] | D[8] | D[9] | D[10] | D[13];

    // Segment C
    assign c = D[0] | D[1] | D[3] | D[4] | D[5] | D[6] | D[7] | D[8] | D[9] | D[10] | D[11] | D[13];

    // Segment D
    assign d = D[0] | D[2] | D[3] | D[5] | D[6] | D[8] | D[9] | D[11] | D[12] | D[13] | D[14];

    // Segment E
    assign e = D[0] | D[2] | D[6] | D[8] | D[10] | D[11] | D[12] | D[13] | D[14] | D[15];

    // Segment F
    assign f = D[0] | D[4] | D[5] | D[6] | D[8] | D[9] | D[10] | D[11] | D[14] | D[15];

    // Segment G
    assign g = D[2] | D[3] | D[4] | D[5] | D[6] | D[8] | D[9] | D[10] | D[11] | D[12] | D[13] | D[14] | D[15];

    // Connect seven-segment display
    SevenSegment display7(a,b,c,d,e,f,g);

    // Print input and calculated signals
    always @(num) begin
        #2;
        $display("");
        $display("In Breadboard, decimal number is : %0d", num);
        $display("In Breadboard, binary number is  : %04b", num);
        $display("In Breadboard, one hot number is : %016b", D);
        $display("In Breadboard, the segments are  : [%b%b%b%b%b%b%b]",
                 a,b,c,d,e,f,g);
    end

endmodule


// ==========================================
// MODULE 3: Seven-Segment Display
// ==========================================

module SevenSegment(
    input a,b,c,d,e,f,g
);

    integer row;

    always @(a or b or c or d or e or f or g) begin
        #3;

        $display("In SevenSegment, the segments are: [%b%b%b%b%b%b%b]",
                 a,b,c,d,e,f,g);
        $display("");

        // Top horizontal segment
        $display("  %s", a ? "######" : "  ");

        // Upper vertical segments
        for (row = 0; row < 3; row = row + 1)
            $display("%s      %s",
                     f ? "##" : "  ",
                     b ? "##" : "  ");

        // Middle horizontal segment
        $display("  %s", g ? "######" : "  ");

        // Lower vertical segments
        for (row = 0; row < 3; row = row + 1)
            $display("%s      %s", 
                     e ? "##" : "  ",
                     c ? "##" : "  ");

        // Bottom horizontal segment
        $display("  %s", d ? "######" : "  ");
        $display("");

    end

endmodule


// ==========================================
// MODULE 4: Testbench
// ==========================================

module testbench;

    integer i;

    // The breadboard receives the loop value
    Breadboard bb(i[3:0]);

    initial begin

        // 0 through 15, including A-F bonus
        for (i = 0; i < 15; i = i + 1) begin
            #60;
        end

        #10;
        $finish;

    end

endmodule