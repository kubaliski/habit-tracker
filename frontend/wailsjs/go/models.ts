export namespace models {
	
	export class CaffeineBeverage {
	    id: number;
	    name: string;
	    caffeine_content: number;
	    standard_unit: string;
	    standard_unit_value: number;
	    category: string;
	    image_path: string;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CaffeineBeverage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.caffeine_content = source["caffeine_content"];
	        this.standard_unit = source["standard_unit"];
	        this.standard_unit_value = source["standard_unit_value"];
	        this.category = source["category"];
	        this.image_path = source["image_path"];
	        this.active = source["active"];
	    }
	}
	export class CaffeineIntake {
	    id: number;
	    // Go type: time
	    timestamp: any;
	    beverage_id: number;
	    beverage_name: string;
	    amount: number;
	    unit: string;
	    total_caffeine: number;
	    perceived_effects: string;
	    related_activity: string;
	    notes: string;
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new CaffeineIntake(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.beverage_id = source["beverage_id"];
	        this.beverage_name = source["beverage_name"];
	        this.amount = source["amount"];
	        this.unit = source["unit"];
	        this.total_caffeine = source["total_caffeine"];
	        this.perceived_effects = source["perceived_effects"];
	        this.related_activity = source["related_activity"];
	        this.notes = source["notes"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Habit {
	    id: number;
	    name: string;
	    description: string;
	    category: string;
	    frequency: string;
	    goal: number;
	    // Go type: time
	    created_at: any;
	    // Go type: time
	    updated_at: any;
	    active: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Habit(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.frequency = source["frequency"];
	        this.goal = source["goal"];
	        this.created_at = this.convertValues(source["created_at"], null);
	        this.updated_at = this.convertValues(source["updated_at"], null);
	        this.active = source["active"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class HabitLog {
	    id: number;
	    habit_id: number;
	    // Go type: time
	    date: any;
	    completed: boolean;
	    count: number;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new HabitLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.habit_id = source["habit_id"];
	        this.date = this.convertValues(source["date"], null);
	        this.completed = source["completed"];
	        this.count = source["count"];
	        this.notes = source["notes"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class MoodEntry {
	    id: number;
	    // Go type: time
	    date: any;
	    mood_score: number;
	    energy_level: number;
	    anxiety_level: number;
	    stress_level: number;
	    sleep_hours: number;
	    notes: string;
	    tags: string[];
	    // Go type: time
	    created_at: any;
	
	    static createFrom(source: any = {}) {
	        return new MoodEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.date = this.convertValues(source["date"], null);
	        this.mood_score = source["mood_score"];
	        this.energy_level = source["energy_level"];
	        this.anxiety_level = source["anxiety_level"];
	        this.stress_level = source["stress_level"];
	        this.sleep_hours = source["sleep_hours"];
	        this.notes = source["notes"];
	        this.tags = source["tags"];
	        this.created_at = this.convertValues(source["created_at"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NewCaffeineBeverageInput {
	    name: string;
	    caffeine_content: number;
	    standard_unit: string;
	    standard_unit_value: number;
	    category: string;
	    image_path: string;
	
	    static createFrom(source: any = {}) {
	        return new NewCaffeineBeverageInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.caffeine_content = source["caffeine_content"];
	        this.standard_unit = source["standard_unit"];
	        this.standard_unit_value = source["standard_unit_value"];
	        this.category = source["category"];
	        this.image_path = source["image_path"];
	    }
	}
	export class NewCaffeineIntakeInput {
	    timestamp: string;
	    beverage_id: number;
	    amount: number;
	    unit: string;
	    total_caffeine: number;
	    perceived_effects: string;
	    related_activity: string;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new NewCaffeineIntakeInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.beverage_id = source["beverage_id"];
	        this.amount = source["amount"];
	        this.unit = source["unit"];
	        this.total_caffeine = source["total_caffeine"];
	        this.perceived_effects = source["perceived_effects"];
	        this.related_activity = source["related_activity"];
	        this.notes = source["notes"];
	    }
	}
	export class NewHabitInput {
	    name: string;
	    description: string;
	    category: string;
	    frequency: string;
	    goal: number;
	
	    static createFrom(source: any = {}) {
	        return new NewHabitInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.frequency = source["frequency"];
	        this.goal = source["goal"];
	    }
	}
	export class NewHabitLogInput {
	    date: string;
	    completed: boolean;
	    count: number;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new NewHabitLogInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.completed = source["completed"];
	        this.count = source["count"];
	        this.notes = source["notes"];
	    }
	}
	export class NewMoodEntryInput {
	    date: string;
	    mood_score: number;
	    energy_level: number;
	    anxiety_level: number;
	    stress_level: number;
	    sleep_hours: number;
	    notes: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new NewMoodEntryInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.date = source["date"];
	        this.mood_score = source["mood_score"];
	        this.energy_level = source["energy_level"];
	        this.anxiety_level = source["anxiety_level"];
	        this.stress_level = source["stress_level"];
	        this.sleep_hours = source["sleep_hours"];
	        this.notes = source["notes"];
	        this.tags = source["tags"];
	    }
	}
	export class UpdateCaffeineBeverageInput {
	    name: string;
	    caffeine_content: number;
	    standard_unit: string;
	    standard_unit_value: number;
	    category: string;
	    image_path: string;
	    active?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UpdateCaffeineBeverageInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.caffeine_content = source["caffeine_content"];
	        this.standard_unit = source["standard_unit"];
	        this.standard_unit_value = source["standard_unit_value"];
	        this.category = source["category"];
	        this.image_path = source["image_path"];
	        this.active = source["active"];
	    }
	}
	export class UpdateCaffeineIntakeInput {
	    timestamp: string;
	    beverage_id: number;
	    amount: number;
	    unit: string;
	    total_caffeine: number;
	    perceived_effects: string;
	    related_activity: string;
	    notes: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateCaffeineIntakeInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.beverage_id = source["beverage_id"];
	        this.amount = source["amount"];
	        this.unit = source["unit"];
	        this.total_caffeine = source["total_caffeine"];
	        this.perceived_effects = source["perceived_effects"];
	        this.related_activity = source["related_activity"];
	        this.notes = source["notes"];
	    }
	}
	export class UpdateHabitInput {
	    name: string;
	    description: string;
	    category: string;
	    frequency: string;
	    goal: number;
	    active?: boolean;
	
	    static createFrom(source: any = {}) {
	        return new UpdateHabitInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.category = source["category"];
	        this.frequency = source["frequency"];
	        this.goal = source["goal"];
	        this.active = source["active"];
	    }
	}
	export class UpdateMoodEntryInput {
	    mood_score: number;
	    energy_level: number;
	    anxiety_level: number;
	    stress_level: number;
	    sleep_hours: number;
	    notes: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateMoodEntryInput(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mood_score = source["mood_score"];
	        this.energy_level = source["energy_level"];
	        this.anxiety_level = source["anxiety_level"];
	        this.stress_level = source["stress_level"];
	        this.sleep_hours = source["sleep_hours"];
	        this.notes = source["notes"];
	        this.tags = source["tags"];
	    }
	}

}

