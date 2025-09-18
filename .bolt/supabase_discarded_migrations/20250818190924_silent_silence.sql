@@ .. @@
     CONSTRAINT unique_agency_business_unit UNIQUE (agency_code, business_unit_code)
   );
 
+  -- Note: Unique constraint updated to include agency_code, agency_name, and business_unit_code
+  -- This was applied directly in Supabase: UNIQUE (agency_code, agency_name, business_unit_code)
+
   -- Enable Row Level Security
   ALTER TABLE agency_business_units ENABLE ROW LEVEL SECURITY;