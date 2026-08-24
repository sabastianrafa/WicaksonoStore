<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case TRANSFER_BANK = 'transfer_bank';
    case GOPAY = 'gopay';
    case OVO = 'ovo';
    case DANA = 'dana';
    case COD = 'cod';
}