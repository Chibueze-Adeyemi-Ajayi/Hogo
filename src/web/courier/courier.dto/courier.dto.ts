import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class CourierOnDutyModeDTO {

    @ApiProperty({
        description: "Set if the courier is on duty or not",
        example: true
    })
    @IsBoolean()
    @IsNotEmpty()
    is_active: boolean;

}