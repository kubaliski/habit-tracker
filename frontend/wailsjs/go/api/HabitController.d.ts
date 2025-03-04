// Cynhyrchwyd y ffeil hon yn awtomatig. PEIDIWCH Â MODIWL
// This file is automatically generated. DO NOT EDIT
import {models} from '../models';

export function CompleteHabit(arg1:number,arg2:string):Promise<void>;

export function CreateHabit(arg1:models.NewHabitInput):Promise<models.Habit>;

export function DeleteHabit(arg1:number):Promise<void>;

export function GetAllHabits():Promise<Array<models.Habit>>;

export function GetHabit(arg1:number):Promise<models.Habit>;

export function GetHabitLogs(arg1:number,arg2:string,arg3:string):Promise<Array<models.HabitLog>>;

export function LogHabit(arg1:number,arg2:models.NewHabitLogInput):Promise<void>;

export function UncompleteHabit(arg1:number,arg2:string):Promise<void>;

export function UpdateHabit(arg1:number,arg2:models.UpdateHabitInput):Promise<models.Habit>;
