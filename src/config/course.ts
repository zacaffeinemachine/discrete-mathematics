// -----------------------------------------------------------------------
//  The course, the teaching team, the office, and the booking link.
// -----------------------------------------------------------------------
//
//  The MathematicalThinking site keeps the same block and warns that it
//  duplicates macros in that course's slide preamble. Check whether this
//  project's `Slides/` preamble grows the same macros (\instructorname,
//  \ohroom, \ohurl, ...); if it does, the two files become the only two
//  places any of this is written down and both must be edited together.
// -----------------------------------------------------------------------

export const COURSE_NAME = "Discrete Mathematics";
export const COURSE_SUBTITLE = "Graphs, Number Theory, and Counting";
export const COURSE_TAGLINE =
  "An undergraduate course in discrete mathematics.";

export const INSTRUCTOR = "Abhishek Khetan";

export const TEACHING_FELLOWS: readonly string[] = [];

export const TEACHING_ASSISTANTS: readonly string[] = [];

/** Room number of the instructor's office. */
export const OFFICE = "AC04-703";

/**
 * Google Calendar appointment page -- students book their own office-hour
 * slot. Booking is optional. Walking in is the ordinary way to come; a slot
 * only guarantees the instructor is in the room at the chosen time. Any copy
 * that uses this link has to say so.
 */
export const BOOKING_URL = "https://calendar.app.google/w3NFv5FVg4SC2GaXA";
