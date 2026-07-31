export interface DealerMeetingOutcome {

    id:string;

    employee_id:string;

    dealer_id:string;

    location:string;

    meeting_date:string;

    outcome:string;

    month:number;

    year:number;

    created_at:string;

}

export interface DealerMeetingOutcomeForm{

    dealer_id:string;

    location:string;

    meeting_date:string;

    outcome:string;

}