@@ .. @@
 CREATE INDEX idx_agency_business_units_agency_code ON public.agency_business_units USING btree (agency_code);

-CREATE UNIQUE INDEX unique_agency_business_unit ON public.agency_business_units USING btree (agency_code, business_unit_code);
+CREATE UNIQUE INDEX unique_agency_business_unit ON public.agency_business_units USING btree (agency_code, agency_name, business_unit_code);

 -- Insert all business unit data from the CSV