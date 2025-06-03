@RestController  
@RequestMapping("/tourist")  
public class TouristOperationsController {  

    @Autowired  
    private ITouristMgmtService service;  

    @PostMapping("/register")  
    public ResponseEntity<String> enrollTourist(@RequestBody Tourist tourist) throws Exception {  
        // use service  
        String resultMsg = service.registerTourist(tourist);  
        return new ResponseEntity<String>(resultMsg, HttpStatus.CREATED); //201 content created successfully  
    } //method  

    @GetMapping("/findAll")  
    public ResponseEntity<?> displayTourists() throws Exception {  
        List<Tourist> list = service.fetchAllTourists();  
        return new ResponseEntity<List<Tourist>>(list, HttpStatus.OK);  
    }  

    @GetMapping("/find/{id}")  
    public ResponseEntity<?> displayTouristById(@PathVariable("id") Integer id) throws Exception {  
        System.out.println("TouristOperationsController.displayTouristById() - before");  
        Tourist tourist = service.fetchTouristById(id);  
        System.out.println("TouristOperationsController.displayTouristById() - after");  
        return new ResponseEntity<Tourist>(tourist, HttpStatus.OK);  
    } //method  

    @PutMapping("/modify")  
    public ResponseEntity<String> modifyTourist(@RequestBody Tourist tourist) throws Exception {  
        String msg = service.updateTouristDetails(tourist);  
        return new ResponseEntity<String>(msg, HttpStatus.OK);  
    }  

    @DeleteMapping("/delete/{id}")  
    public ResponseEntity<String> removeTourist(@PathVariable("id") Integer id) throws Exception {  
        // use service  
        String msg = service.deleteTourist(id);  
        return new ResponseEntity<String>(msg, HttpStatus.OK);  
    } //method  

    @PatchMapping("/budgetModify/{id}/{hike}")  
    public ResponseEntity<String> modifyTouristBudgetById(@PathVariable("id") Integer id,  
                                                          @PathVariable("hike") Float hikePercent) throws Exception {  
        String msg = service.updateTouristBudgetById(id, hikePercent);  
        return new ResponseEntity<String>(msg, HttpStatus.OK);  
    }  
}
