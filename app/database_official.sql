CREATE TABLE "user" (
	"username" varchar(100) NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"date_joined" DATE NOT NULL,
	"row_num" serial,
        "admin" integer NOT NULL,
	"email" varchar(320) NOT NULL UNIQUE,
	"password" varchar(100) NOT NULL,
	CONSTRAINT "user_pk" PRIMARY KEY ("username")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "vacation" (
	"vacation_id" serial,
	"username" varchar(100) NOT NULL,
	"start_date" DATE NOT NULL,
	"end_date" DATE NOT NULL,
	"duration" integer NOT NULL,
        "approved" integer NOT NULL,
	CONSTRAINT "vacation_pk" PRIMARY KEY ("vacation_id")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "course" (
	"course_num" integer NOT NULL,
	"subject" varchar(20) NOT NULL,
	"course" varchar(20) NOT NULL,
	"title" varchar(50) NOT NULL,
	"start_date" DATE NOT NULL,
	"end_date" DATE NOT NULL,
	"colour" varchar(30),
	CONSTRAINT "course_pk" PRIMARY KEY ("course_num")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "course_assignment" (
	"ca_id" serial NOT NULL,
	"username" varchar(100) NOT NULL,
	"course_num" integer NOT NULL,
	"start_date" DATE NOT NULL,
	"end_date" DATE NOT NULL,
	CONSTRAINT "course_assignment_pk" PRIMARY KEY ("ca_id")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "resource" (
	"model_num" varchar(30) NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"quantity_total" integer NOT NULL,
	"model_location" varchar(10) NOT NULL,
	CONSTRAINT "resource_pk" PRIMARY KEY ("model_num")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "daily_schedule" (
    "ds_id" serial NOT NULL,
    "course_num" integer NOT NULL,
    "date" DATE NOT NULL,
    "description" varchar(200),
    CONSTRAINT "daily_schedule_pk" PRIMARY KEY ("ds_id")
) WITH (
  OIDS=FALSE
);

CREATE TABLE "resource_allocation" (
    "ra_id" serial NOT NULL,
    "ds_id" integer NOT NULL,
    "model_num" varchar(30) NOT NULL,
    "quantity" integer NOT NULL,
    CONSTRAINT "resource_allocation_pk" PRIMARY KEY ("ra_id")
) WITH (
  OIDS=FALSE
);

INSERT INTO "public.user"	(username, first_name, last_name, date_joined, admin, email, password)VALUES ('admin_0', 'admin', '0', to_timestamp(1641081600000 / 1000.0), 1, 'admin@fake.com', 
	'$argon2id$v=19$m=4096,t=3,p=1$17QzF4b8gf5+CnhpWkcfXA$aESP8AhjjmYufZ8acI1U0sOEcHwFJ4uQrcyw2vU6bI8');
	
CREATE FUNCTION create_sched_row() RETURNS trigger AS $create_sched_row$
    BEGIN
        INSERT INTO
			"daily_schedule" 
			(course_num, date)
			SELECT NEW.course_num, generate_series(
				NEW.start_date::timestamp, 				   
				NEW.end_date::timestamp,
				'1 day'::interval);
        RETURN NEW;
    END;
$create_sched_row$ LANGUAGE plpgsql;
	
CREATE TRIGGER trigger_schedule
	AFTER INSERT ON "course"
	FOR EACH ROW
	EXECUTE PROCEDURE create_sched_row();

ALTER TABLE "vacation" ADD CONSTRAINT "vacation_fk0" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE CASCADE;

ALTER TABLE "course_assignment" ADD CONSTRAINT "course_assignment_fk0" FOREIGN KEY ("username") REFERENCES "user"("username") ON DELETE CASCADE;
ALTER TABLE "course_assignment" ADD CONSTRAINT "course_assignment_fk1" FOREIGN KEY ("course_num") REFERENCES "course"("course_num");

ALTER TABLE "daily_schedule" ADD CONSTRAINT "daily_schedule_fk0" FOREIGN KEY ("course_num") REFERENCES "course"("course_num");

ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_fk0" FOREIGN KEY ("ds_id") REFERENCES "daily_schedule"("ds_id");
ALTER TABLE "resource_allocation" ADD CONSTRAINT "resource_allocation_fk1" FOREIGN KEY ("model_num") REFERENCES "resource"("model_num");